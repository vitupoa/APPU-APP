import { prisma } from '../../config/database.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import crypto from 'crypto';
import PayPalService from '../../services/payment/paypal.service.js';
import PaystackService from '../../services/payment/paystack.service.js';

export class WalletService {
  /**
   * Retrieves the wallet balance ensuring a wallet exists.
   */
  static async getBalance(userId: string, targetCurrency?: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { user: { select: { isWalletUnlocked: true, currency: true } } }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId },
        include: { user: { select: { isWalletUnlocked: true, currency: true } } }
      });
    }

    const currencyToUse = targetCurrency || wallet.user.currency;

    // Convert Kr balance to user fiat equivalent using display-adjusted rate
    // 1 Kr = $0.01 USD. Apply the display rate (with silent platform adjustment)
    const fiatRate = await ExchangeService.getDisplayRate(currencyToUse);
    const baseUsd = Number(wallet.krBalance) / 100;
    const fiatEquivalent = baseUsd * fiatRate;

    return {
      krBalance: wallet.krBalance,
      fiatEquivalent,
      currency: currencyToUse,
      isWalletUnlocked: wallet.user.isWalletUnlocked
    };
  }

  /**
   * Transfers a Tip from one user to another atomically parsing explicit Tokenomics (15% platform cut).
   */
  static async sendTip(senderId: string, recipientId: string, senderKrAmount: number, senderCurrency: string) {
    if (senderId === recipientId) {
      throw new Error("You cannot tip yourself");
    }

    if (!Number.isInteger(senderKrAmount) || senderKrAmount < 1) {
      throw new Error("Tip amount must be a whole Kr integer strictly above 0.");
    }

    // 1 Kr = $0.01. Calculate specific fiat tracking values!
    const baseUsd = ExchangeService.getUSDFromKr(senderKrAmount);
    const localRate = await ExchangeService.getTransactionRate(senderCurrency, 'sell');
    const fiatAmount = baseUsd * localRate;

    const krDecimal = new Prisma.Decimal(senderKrAmount);
    
    // TIPPING TAX LOGIC
    const PLATFORM_FEE_RATE = 0.15; // 15% Explicit Cut mapped
    const platformCut = senderKrAmount * PLATFORM_FEE_RATE;
    const recipientReceiveAmount = new Prisma.Decimal(senderKrAmount - platformCut);
    const platformCutDecimal = new Prisma.Decimal(platformCut);

    // Execute atomic transaction for balance safety
    return prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({ where: { userId: senderId } });
      if (!senderWallet || senderWallet.krBalance.lessThan(krDecimal)) {
        throw new Error("Insufficient Kr balance to tip");
      }

      // Deduct Full Amount Sender (-100%)
      await tx.wallet.update({
        where: { userId: senderId },
        data: { krBalance: { decrement: krDecimal } }
      });

      // Credit Recipient (-15% Platform cut applied -> 85%)
      const recipientWallet = await tx.wallet.upsert({
        where: { userId: recipientId },
        create: { userId: recipientId, krBalance: recipientReceiveAmount },
        update: { krBalance: { increment: recipientReceiveAmount } }
      });

      // Record Transactions accurately outlining Revenue Velocity
      await tx.transaction.createMany({
        data: [
          {
            userId: senderId,
            counterpartyId: recipientId,
            type: 'tip_sent',
            amountKr: krDecimal,
            amountFiat: fiatAmount,
            currency: senderCurrency,
            status: 'completed',
            provider: 'platform'
          },
          {
            userId: recipientId,
            counterpartyId: senderId,
            type: 'tip_received',
            amountKr: recipientReceiveAmount,
            status: 'completed',
            provider: 'platform'
          },
          {
            userId: senderId, // Associated essentially with the action
            counterpartyId: 'PLATFORM_REVENUE',
            type: 'platform_fee',
            amountKr: platformCutDecimal,
            status: 'completed',
            provider: 'platform_engine'
          }
        ]
      });

      // Unlock Recipient Identity if this is their first inflow!
      const recipientUser = await tx.user.findUnique({ where: { id: recipientId } });
      if (recipientUser && !recipientUser.isWalletUnlocked) {
        await tx.user.update({
          where: { id: recipientId },
          data: { isWalletUnlocked: true }
        });
      }

      return {
        success: true,
        krTipped: senderKrAmount,
        krReceived: recipientReceiveAmount.toNumber(),
        platformFee: platformCut
      };
    });
  }

  static async getTransactions(userId: string, limit: number = 20, offset: number = 0) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return transactions;
  }

  static async searchUsers(query: string) {
    if (!query || query.length < 2) {
      return [];
    }
    
    // Search by username or display name
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 20,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true
      }
    });

    return users.map((u: any) => ({
      ...u,
      isLovers: false // Adjust if necessary
    }));
  }

  /**
   * Initiates a top-up transaction
   */
  static async initiateTopup(
    userId: string,
    fiatAmount: number,
    currency: string,
    provider: 'paypal' | 'paystack' | 'mpesa',
    phoneNumber?: string,
    email?: string
  ) {
    // Calculate Kr amount user will receive
    const buyRate = await ExchangeService.getTransactionRate(currency, 'buy');
    const baseUsd = fiatAmount / buyRate;
    const krAmount = Math.floor(baseUsd * 100); // 1 Kr = $0.01 USD

    if (krAmount < 1) {
      throw new Error('Amount too small. Minimum 1 Kr required.');
    }

    // Generate unique transaction reference
    const reference = `TOPUP_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'topup',
        amountKr: new Prisma.Decimal(krAmount),
        amountFiat: fiatAmount,
        currency,
        provider,
        status: 'pending',
        reference,
        metadata: { phoneNumber, email }
      }
    });

    // Generate payment instructions based on provider
    let paymentInstructions: any = {};

    switch (provider) {
      case 'mpesa':
        if (!phoneNumber) {
          throw new Error('Phone number required for M-Pesa');
        }
        paymentInstructions = {
          provider: 'mpesa',
          phoneNumber,
          amount: fiatAmount,
          currency,
          instructions: `You will receive an M-Pesa prompt on ${phoneNumber}. Enter your PIN to complete the payment.`,
          paybill: '400200', // Example paybill number
          accountNumber: reference
        };
        break;

      case 'paypal':
        if (!email) {
          throw new Error('Email required for PayPal');
        }
        try {
          const paypalOrder = await PayPalService.createOrder(fiatAmount, currency, reference, email);
          paymentInstructions = {
            provider: 'paypal',
            amount: fiatAmount,
            currency,
            paymentUrl: paypalOrder.approvalUrl,
            orderId: paypalOrder.orderId,
            instructions: 'Click "Continue to Payment" to complete your payment via PayPal. You can pay with your PayPal balance, linked bank account, or credit/debit card.'
          };
          
          // Store PayPal order ID in metadata
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              metadata: { phoneNumber, email, paypalOrderId: paypalOrder.orderId }
            }
          });
        } catch (error: any) {
          throw new Error(`PayPal integration error: ${error.message}`);
        }
        break;

      case 'paystack':
        if (!email) {
          throw new Error('Email required for Paystack');
        }
        try {
          const paystackTx = await PaystackService.initializeTransaction(
            fiatAmount,
            currency,
            email,
            reference
          );
          
          // Get mobile money providers if applicable
          const mobileMoneyProviders = PaystackService.getMobileMoneyProviders(currency.substring(0, 2));
          const supportedChannels = PaystackService.getSupportedChannels(currency.substring(0, 2));
          
          let instructions = 'Click "Continue to Payment" to complete your payment via Paystack. ';
          if (supportedChannels.includes('card')) {
            instructions += 'You can pay with your debit/credit card. ';
          }
          if (supportedChannels.includes('mobile_money') && mobileMoneyProviders.length > 0) {
            instructions += `Mobile Money supported: ${mobileMoneyProviders.join(', ')}. `;
          }
          if (supportedChannels.includes('bank_transfer')) {
            instructions += 'Bank transfer available. ';
          }
          if (supportedChannels.includes('ussd')) {
            instructions += 'USSD payment available.';
          }
          
          paymentInstructions = {
            provider: 'paystack',
            amount: fiatAmount,
            currency,
            paymentUrl: paystackTx.authorizationUrl,
            accessCode: paystackTx.accessCode,
            instructions,
            supportedChannels,
            mobileMoneyProviders
          };
          
          // Store Paystack access code in metadata
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              metadata: { phoneNumber, email, paystackAccessCode: paystackTx.accessCode }
            }
          });
        } catch (error: any) {
          throw new Error(`Paystack integration error: ${error.message}`);
        }
        break;
    }

    return {
      success: true,
      transactionId: transaction.id,
      reference,
      krAmount,
      fiatAmount,
      currency,
      provider,
      status: 'pending',
      paymentInstructions
    };
  }

  /**
   * Confirms and completes a top-up transaction
   */
  static async confirmTopup(
    userId: string,
    transactionId: string,
    paymentReference?: string
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Transaction already ${transaction.status}`);
    }

    // In production, verify payment with provider API here
    // For now, we'll simulate successful payment

    return prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'completed',
          metadata: {
            ...(transaction.metadata as any),
            paymentReference,
            completedAt: new Date().toISOString()
          }
        }
      });

      // Credit user wallet
      await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          krBalance: transaction.amountKr
        },
        update: {
          krBalance: { increment: transaction.amountKr }
        }
      });

      // Unlock wallet if first topup
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && !user.isWalletUnlocked) {
        await tx.user.update({
          where: { id: userId },
          data: { isWalletUnlocked: true }
        });
      }

      return {
        success: true,
        transactionId,
        krAmount: transaction.amountKr.toNumber(),
        status: 'completed'
      };
    });
  }
}
