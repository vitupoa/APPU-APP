import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { WalletService } from '../wallet/wallet.service.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { MpesaService } from '../../services/payments/mpesa.service.js';
import { PaypalService } from '../../services/payments/paypal.service.js';
import { PaystackService } from '../../services/payments/paystack.service.js';
import { topupInitiateSchema, withdrawInitiateSchema } from '../wallet/wallet.validation.js';
import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
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
          where: { userId: opsUser.id },
          create: { userId: opsUser.id, krBalance: new Prisma.Decimal(feeKr) },
          update: { krBalance: { increment: new Prisma.Decimal(feeKr) } },
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
    const userId = req.userId!;
    const reference = `topup_${userId}_${Date.now()}`;

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
          referenceId: reference
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
        userId,
        type: 'topup',
        amountFiat: data.fiatAmount,
        amountKr: new Prisma.Decimal(0), // Calculated on confirmation
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
      orderBy: { createdAt: 'desc' }
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
            amountKr: krAmount,
            reference: parsed.mpesaReceiptNumber || tx.reference
          }
        });

        await dbTx.wallet.upsert({
          where: { userId: tx.userId },
          create: { userId: tx.userId, krBalance: krAmount },
          update: { krBalance: { increment: krAmount } }
        });

        // Unlock wallet identity on first inflow
        await dbTx.user.update({
          where: { id: tx.userId },
          data: { isWalletUnlocked: true }
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
    const { orderId } = req.body;
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
          where: { userId: req.userId!, provider: 'paypal', status: 'pending' },
          orderBy: { createdAt: 'desc' }
        });

        if (tx) {
          await dbTx.transaction.update({
            where: { id: tx.id },
            data: {
              status: 'completed',
              amountKr: krAmount,
              reference: capture.captureId
            }
          });
        }

        await dbTx.wallet.upsert({
          where: { userId: req.userId! },
          create: { userId: req.userId!, krBalance: krAmount },
          update: { krBalance: { increment: krAmount } }
        });

        await dbTx.user.update({
          where: { id: req.userId! },
          data: { isWalletUnlocked: true }
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
            data: { status: 'completed', amountKr: krAmount }
          });

          await dbTx.wallet.upsert({
            where: { userId: tx.userId },
            create: { userId: tx.userId, krBalance: krAmount },
            update: { krBalance: { increment: krAmount } }
          });

          await dbTx.user.update({
            where: { id: tx.userId },
            data: { isWalletUnlocked: true }
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

export default router;
