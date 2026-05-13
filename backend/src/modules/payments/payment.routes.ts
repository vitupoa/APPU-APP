import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { WalletService } from '../wallet/wallet.service.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { MpesaService } from '../../services/payments/mpesa.service.js';
import { PaypalService } from '../../services/payments/paypal.service.js';
import { PaystackService } from '../../services/payments/paystack.service.js';
import { topupInitiateSchema, withdrawInitiateSchema } from '../wallet/wallet.validation.js';
import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

/**
 * Silently credits @JohnOyugi's creator wallet with the exchange fee portion
 * collected from a top-up. This runs inside the same db transaction.
 * The 4.5% margin is captured implicitly (user gets fewer Kr) — that stays as platform value.
 */
async function creditOperationalFee(tx: any, fiatAmount: number, currency: string) {
  try {
    const feeKr = await ExchangeService.getTopupFeeKr(fiatAmount, currency);
    if (feeKr > 0) {
      const opsUser = await tx.user.findFirst({ where: { username: 'JohnOyugi' } });
      if (opsUser) {
        await tx.wallet.upsert({
          where: { user_id: opsUser.id },
          create: { user_id: opsUser.id, kr_balance: new Prisma.Decimal(feeKr) },
          update: { kr_balance: { increment: new Prisma.Decimal(feeKr) } },
        });
      }
    }
  } catch (e) {
    // Silently fail — never block user top-up for internal accounting
  }
}

const router = Router();

/**
 * POST /api/v1/payments/topup
 * Initiates a top-up via user's chosen provider.
 */
router.post('/topup', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = topupInitiateSchema.parse(req.body);
    const userId = req.user_id!;
    const reference = `topup_${user_id}_${Date.now()}`;

    let result: any;

    switch (data.provider) {
      case 'mpesa': {
        if (!data.phoneNumber) {
          res.status(400).json({ error: 'Phone number required for M-Pesa' });
          return;
        }
        result = await MpesaService.initiateStk({
          phoneNumber: data.phoneNumber,
          amount: data.fiatAmount,
          accountReference: reference,
          transactionDesc: 'Krieta Wallet Top-Up'
        });
        break;
      }
      case 'paypal': {
        result = await PaypalService.createOrder({
          amount: data.fiatAmount,
          currency: data.currency,
          description: 'Krieta Wallet Top-Up',
          reference_id: reference
        });
        break;
      }
      case 'paystack': {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.email) {
          res.status(400).json({ error: 'Email required for Paystack' });
          return;
        }
        result = await PaystackService.initializeTransaction({
          email: user.email,
          amount: data.fiatAmount,
          currency: data.currency,
          reference
        });
        break;
      }
    }

    // Record pending transaction
    await prisma.transaction.create({
      data: {
        user_id,
        type: 'topup',
        amount_fiat: data.fiatAmount,
        amount_kr: new Prisma.Decimal(0), // Calculated on confirmation
        currency: data.currency,
        status: 'pending',
        provider: data.provider,
        reference
      }
    });

    res.status(200).json({ reference, ...result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * POST /api/v1/payments/mpesa/callback
 * Safaricom calls this after STK Push completes.
 */
router.post('/mpesa/callback', async (req: Request, res: Response) => {
  try {
    const parsed = MpesaService.parseCallback(req.body);

    // Find the pending transaction
    const tx = await prisma.transaction.findFirst({
      where: {
        provider: 'mpesa',
        status: 'pending',
        // M-Pesa doesn't give us our reference back in callback,
        // so we match by the most recent pending mpesa tx
      },
      orderBy: { created_at: 'desc' }
    });

    if (!tx) {
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    if (parsed.success && parsed.amount) {
      const rate = await ExchangeService.getTransactionRate('KES', 'buy');
      const krAmount = new Prisma.Decimal(parsed.amount / rate);

      await prisma.$transaction(async (dbTx) => {
        await dbTx.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'completed',
            amount_kr: krAmount,
            reference: parsed.mpesaReceiptNumber || tx.reference
          }
        });

        await dbTx.wallet.upsert({
          where: { user_id: tx.user_id },
          create: { user_id: tx.user_id, kr_balance: krAmount },
          update: { kr_balance: { increment: krAmount } }
        });

        // Unlock wallet identity on first inflow
        await dbTx.user.update({
          where: { id: tx.user_id },
          data: { is_wallet_unlocked: true }
        });

        // Credit platform revenue wallet with exchange fee
        await creditOperationalFee(dbTx, parsed.amount!, 'KES');
      });
    } else {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'failed' }
      });
    }

    // Always return success to Safaricom
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error: any) {
    console.error('M-Pesa callback error:', error.message);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

/**
 * POST /api/v1/payments/paypal/capture
 * Frontend calls after user approves PayPal order.
 */
router.post('/paypal/capture', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { order_id } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'orderId is required' });
      return;
    }

    const capture = await PaypalService.captureOrder(orderId);

    if (capture.success) {
      const rate = await ExchangeService.getTransactionRate(capture.currency, 'buy');
      const krAmount = new Prisma.Decimal(capture.amount / rate);

      await prisma.$transaction(async (dbTx) => {
        // Find pending tx
        const tx = await dbTx.transaction.findFirst({
          where: { user_id: req.user_id!, provider: 'paypal', status: 'pending' },
          orderBy: { created_at: 'desc' }
        });

        if (tx) {
          await dbTx.transaction.update({
            where: { id: tx.id },
            data: {
              status: 'completed',
              amount_kr: krAmount,
              reference: capture.captureId
            }
          });
        }

        await dbTx.wallet.upsert({
          where: { user_id: req.user_id! },
          create: { user_id: req.user_id!, kr_balance: krAmount },
          update: { kr_balance: { increment: krAmount } }
        });

        await dbTx.user.update({
          where: { id: req.user_id! },
          data: { is_wallet_unlocked: true }
        });

        // Credit platform revenue wallet with exchange fee
        await creditOperationalFee(dbTx, capture.amount, capture.currency);
      });

      res.status(200).json({ success: true, krAmount });
    } else {
      res.status(400).json({ error: 'PayPal capture failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/payments/paystack/webhook
 * Paystack calls this on payment events.
 */
router.post('/paystack/webhook', async (req: Request, res: Response) => {
  try {
    // Verify signature
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody = JSON.stringify(req.body);
    if (!PaystackService.verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const parsed = PaystackService.parseWebhook(req.body);

    if (parsed.event === 'charge.success') {
      const tx = await prisma.transaction.findFirst({
        where: { reference: parsed.reference, status: 'pending' }
      });

      if (tx) {
        const rate = await ExchangeService.getTransactionRate(parsed.currency, 'buy');
        const krAmount = new Prisma.Decimal(parsed.amount / rate);

        await prisma.$transaction(async (dbTx) => {
          await dbTx.transaction.update({
            where: { id: tx.id },
            data: { status: 'completed', amount_kr: krAmount }
          });

          await dbTx.wallet.upsert({
            where: { user_id: tx.user_id },
            create: { user_id: tx.user_id, kr_balance: krAmount },
            update: { kr_balance: { increment: krAmount } }
          });

          await dbTx.user.update({
            where: { id: tx.user_id },
            data: { is_wallet_unlocked: true }
          });

          // Credit platform revenue wallet with exchange fee
          await creditOperationalFee(dbTx, parsed.amount, parsed.currency);
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    console.error('Paystack webhook error:', error.message);
    res.status(200).json({ status: 'ok' });
  }
});

/**
 * POST /api/v1/payments/withdraw
 * Initiates a withdrawal to user's chosen provider.
 */
router.post('/withdraw', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = withdrawInitiateSchema.parse(req.body);
    const userId = req.user_id!;
    const reference = `withdraw_${user_id}_${Date.now()}`;

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({ where: { user_id } });
    if (!wallet || wallet.kr_balance.lessThan(data.krAmount)) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // Convert Kr to fiat
    const rate = await ExchangeService.getTransactionRate(data.currency, 'sell');
    const fiatAmount = Number(data.krAmount) * rate;

    let result: any;

    switch (data.provider) {
      case 'mpesa': {
        if (!data.phoneNumber) {
          res.status(400).json({ error: 'Phone number required for M-Pesa' });
          return;
        }
        result = await MpesaService.initiateWithdrawal({
          phoneNumber: data.phoneNumber,
          amount: fiatAmount,
          reference,
          remarks: 'Krieta Withdrawal'
        });
        break;
      }
      case 'paypal': {
        if (!data.email) {
          res.status(400).json({ error: 'Email required for PayPal' });
          return;
        }
        result = await PaypalService.createPayout({
          email: data.email,
          amount: fiatAmount,
          currency: data.currency,
          reference,
          note: 'Krieta Withdrawal'
        });
        break;
      }
      case 'paystack': {
        if (!data.accountNumber || !data.bankCode) {
          res.status(400).json({ error: 'Account details required for Paystack' });
          return;
        }
        result = await PaystackService.initiateTransfer({
          accountNumber: data.accountNumber,
          bankCode: data.bankCode,
          amount: fiatAmount,
          currency: data.currency,
          reference,
          reason: 'Krieta Withdrawal',
          recipientName: data.accountName || 'User',
          country: data.country // Pass country code (NG, GH, ZA, KE)
        });
        break;
      }
    }

    // Create withdrawal request
    await prisma.withdrawalRequest.create({
      data: {
        user_id,
        amount_kr: new Prisma.Decimal(data.krAmount),
        amount_fiat: fiatAmount,
        currency: data.currency,
        provider: data.provider,
        accountName: data.accountName || '',
        accountDetails: data,
        status: 'PENDING'
      }
    });

    // Deduct from wallet
    await prisma.wallet.update({
      where: { user_id },
      data: { kr_balance: { decrement: new Prisma.Decimal(data.krAmount) } }
    });

    res.status(200).json({ reference, ...result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * POST /api/v1/payments/verify-account
 * Verifies account name for withdrawal.
 */
router.post('/verify-account', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, phoneNumber, email, accountNumber, bankCode, country } = req.body;

    let result: any;

    switch (provider) {
      case 'mpesa':
        if (!phoneNumber) {
          res.status(400).json({ error: 'Phone number required' });
          return;
        }
        result = await MpesaService.verifyAccountName(phoneNumber);
        break;
      case 'paypal':
        if (!email) {
          res.status(400).json({ error: 'Email required' });
          return;
        }
        result = await PaypalService.verifyEmail(email);
        break;
      case 'paystack':
        if (!accountNumber || !bankCode) {
          res.status(400).json({ error: 'Account details required' });
          return;
        }
        result = await PaystackService.verifyAccountName({ 
          accountNumber, 
          bankCode,
          country // Pass country code for proper verification
        });
        break;
      default:
        res.status(400).json({ error: 'Invalid provider' });
        return;
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/payments/banks
 * Lists supported banks for Paystack.
 */
router.get('/banks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const country = (req.query.country as string) || 'NG';
    const banks = await PaystackService.listBanks(country);
    res.status(200).json({ banks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/payments/paystack/countries
 * Lists supported countries for Paystack transfers.
 */
router.get('/paystack/countries', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const countries = PaystackService.getSupportedCountries();
    res.status(200).json({ countries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/payments/mpesa/b2c/result
 * M-Pesa B2C result callback.
 */
router.post('/mpesa/b2c/result', async (req: Request, res: Response) => {
  try {
    const result = req.body?.Result;
    if (!result) {
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
      return;
    }

    const reference = result.TransactionID;
    const resultCode = result.ResultCode;

    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: { provider: 'mpesa', status: 'PENDING' },
      orderBy: { created_at: 'desc' }
    });

    if (withdrawal) {
      await prisma.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: {
          status: resultCode === 0 ? 'COMPLETED' : 'FAILED'
        }
      });

      // If failed, refund to wallet
      if (resultCode !== 0) {
        await prisma.wallet.update({
          where: { user_id: withdrawal.user_id },
          data: { kr_balance: { increment: withdrawal.amount_kr } }
        });
      }
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error: any) {
    console.error('M-Pesa B2C result error:', error.message);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

export default router;
