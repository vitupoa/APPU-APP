import { prisma } from '../../config/database.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import PayPalService from '../../services/payment/paypal.service.js';
import PaystackService from '../../services/payment/paystack.service.js';
import { MpesaService } from '../../services/payments/mpesa.service.js';
import { lockWalletForUpdate, lockWalletsForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';

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
   * Uses database locks to prevent race conditions.
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

    // Execute atomic transaction with deadlock retry
    return withDeadlockRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // LOCK: Lock both wallets to prevent race conditions (ordered to prevent deadlocks)
        const wallets = await lockWalletsForUpdate(tx, [senderId, recipientId]);
        const senderWallet = wallets.find((w: any) => w.user_id === senderId);
        
        if (!senderWallet || senderWallet.kr_balance < senderKrAmount) {
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
      }, {
        isolationLevel: 'Serializable',
        timeout: 10000
      });
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
   * Initiates a top-up transaction with strict security validations
   */
  static async initiateTopup(
    userId: string,
    fiatAmount: number,
    currency: string,
    provider: 'paypal' | 'paystack' | 'mpesa',
    phoneNumber?: string,
    email?: string,
    ipAddress?: string
  ) {
    // SECURITY: Validate and sanitize inputs
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    // SECURITY: Strict amount validation - prevent negative, zero, or manipulated amounts
    // Only allow whole numbers (no decimals)
    if (!Number.isInteger(fiatAmount) || fiatAmount <= 0 || fiatAmount > 1000000) {
      throw new Error('Invalid amount. Must be a whole number between 1 and 1,000,000.');
    }

    // SECURITY: Validate currency format (ISO 4217)
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('Invalid currency format');
    }

    // SECURITY: Validate provider
    if (!['paypal', 'paystack', 'mpesa'].includes(provider)) {
      throw new Error('Invalid payment provider');
    }

    // SECURITY: Validate phone number format for M-Pesa
    if (provider === 'mpesa') {
      if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }
    }

    // SECURITY: Validate email format
    if ((provider === 'paypal' || provider === 'paystack') && email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format');
      }
    }

    // SECURITY: Rate limiting - check recent transactions
    const recentTransactions = await prisma.transaction.count({
      where: {
        userId,
        type: 'topup',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last 1 minute
        }
      }
    });

    if (recentTransactions >= 1) {
      throw new Error('Too many top-up attempts. Please wait a moment.');
    }

    // Calculate Kr amount user will receive using server-side rate (NEVER trust client)
    // Apply 4.5% platform margin + KES 30 flat fee
    const buyRate = await ExchangeService.getTransactionRate(currency, 'buy');
    
    // Deduct KES 30 flat fee first
    const fiatAfterFlatFee = Math.max(0, fiatAmount - 30);
    
    // Apply 4.5% margin
    const platformMargin = 0.045;
    const fiatAfterMargin = fiatAfterFlatFee * (1 - platformMargin);
    
    // Convert to USD base
    const baseUsd = fiatAfterMargin / buyRate;
    
    // Convert to Kr (1 Kr = $0.01 USD)
    const krAmount = Math.floor(baseUsd * 100);

    if (krAmount < 1) {
      throw new Error('Amount too small after fees. Minimum 1 Kr required.');
    }

    // SECURITY: Generate cryptographically secure unique reference
    const reference = `TOPUP_${Date.now()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // SECURITY: Create pending transaction with exact amounts (immutable record)
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
        metadata: { 
          phoneNumber: phoneNumber || null, 
          email: email || null,
          initiatedAt: new Date().toISOString(),
          ipAddress: ipAddress || 'unknown'
        }
      }
    });

    // Generate payment instructions based on provider
    let paymentInstructions: any = {};

    switch (provider) {
      case 'mpesa':
        if (!phoneNumber) {
          throw new Error('Phone number required for M-Pesa');
        }
        try {
          const mpesaStk = await MpesaService.initiateStk({
            phoneNumber,
            amount: fiatAmount,
            accountReference: reference,
            transactionDesc: `Krieta Wallet Top-up - ${krAmount} Kr`
          });
          
          paymentInstructions = {
            provider: 'mpesa',
            phoneNumber,
            amount: fiatAmount,
            currency,
            instructions: `An M-Pesa prompt has been sent to ${phoneNumber}. Enter your PIN to complete the payment.`,
            checkoutRequestId: mpesaStk.checkoutRequestId
          };
          
          // Store M-Pesa checkout request ID in metadata
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              metadata: { 
                ...transaction.metadata as any,
                checkoutRequestId: mpesaStk.checkoutRequestId,
                merchantRequestId: mpesaStk.merchantRequestId
              }
            }
          });
        } catch (error: any) {
          // Mark transaction as failed
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'failed' }
          });
          throw new Error(`M-Pesa integration error: ${error.message}`);
        }
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
              metadata: { 
                ...transaction.metadata as any,
                paypalOrderId: paypalOrder.orderId
              }
            }
          });
        } catch (error: any) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'failed' }
          });
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
              metadata: { 
                ...transaction.metadata as any,
                paystackAccessCode: paystackTx.accessCode,
                paystackReference: reference
              }
            }
          });
        } catch (error: any) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'failed' }
          });
          throw new Error(`Paystack integration error: ${error.message}`);
        }
        break;
    }

    // SECURITY: Return only necessary data, never expose sensitive metadata
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
   * Confirms and completes a top-up transaction with strict security checks and database locks
   * CRITICAL: This should ONLY be called from verified webhook handlers
   */
  static async confirmTopup(
    userId: string,
    transactionId: string,
    paymentReference?: string,
    verifiedAmount?: number,
    verifiedCurrency?: string
  ) {
    // SECURITY: Validate inputs
    if (!userId || !transactionId) {
      throw new Error('Invalid parameters');
    }

    // SECURITY: Fetch transaction with lock to prevent race conditions
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // SECURITY: Verify transaction belongs to user
    if (transaction.userId !== userId) {
      throw new Error('Unauthorized: Transaction does not belong to user');
    }

    // SECURITY: Prevent double-crediting - only process pending transactions
    if (transaction.status !== 'pending') {
      console.warn(`Attempt to confirm non-pending transaction: ${transactionId}, status: ${transaction.status}`);
      throw new Error(`Transaction already ${transaction.status}`);
    }

    // SECURITY: Verify transaction is not expired (30 minutes timeout)
    const transactionAge = Date.now() - transaction.createdAt.getTime();
    if (transactionAge > 30 * 60 * 1000) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'expired' }
      });
      throw new Error('Transaction expired');
    }

    // SECURITY: If verified amount provided, ensure it matches transaction amount
    if (verifiedAmount !== undefined) {
      const transactionAmount = typeof transaction.amountFiat === 'number' ? transaction.amountFiat : 0;
      const amountMatch = Math.abs(verifiedAmount - transactionAmount) < 0.01;
      if (!amountMatch) {
        console.error(`Amount mismatch: Expected ${transaction.amountFiat}, got ${verifiedAmount}`);
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: 'failed', metadata: { ...transaction.metadata as any, error: 'Amount mismatch' } }
        });
        throw new Error('Payment amount mismatch');
      }
    }

    // SECURITY: If verified currency provided, ensure it matches
    if (verifiedCurrency && verifiedCurrency !== transaction.currency) {
      console.error(`Currency mismatch: Expected ${transaction.currency}, got ${verifiedCurrency}`);
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'failed', metadata: { ...transaction.metadata as any, error: 'Currency mismatch' } }
      });
      throw new Error('Payment currency mismatch');
    }

    // SECURITY: Use atomic transaction with deadlock retry and database locks
    return withDeadlockRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // LOCK: Lock wallet to prevent race conditions
        await lockWalletForUpdate(tx, userId);
        
        // Double-check status within transaction
        const txCheck = await tx.transaction.findUnique({
          where: { id: transactionId }
        });

        if (!txCheck || txCheck.status !== 'pending') {
          throw new Error('Transaction state changed');
        }

        // Update transaction status
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'completed',
            metadata: {
              ...(transaction.metadata as any),
              paymentReference,
              completedAt: new Date().toISOString(),
              verifiedAmount,
              verifiedCurrency
            }
          }
        });

        // SECURITY: Credit wallet with EXACT amount from transaction record (not from parameters)
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

        console.log(`✅ Top-up confirmed: User ${userId}, Transaction ${transactionId}, Amount ${transaction.amountKr} Kr`);

        return {
          success: true,
          transactionId,
          krAmount: transaction.amountKr.toNumber(),
          status: 'completed'
        };
      }, {
        isolationLevel: 'Serializable', // Highest isolation level
        timeout: 10000 // 10 second timeout
      });
    });
  }

  /**
   * Verify bank account details
   */
  static async verifyAccount(accountNumber: string, bankCode: string, country: string) {
    try {
      // For now, we'll use Paystack's account verification for supported countries
      if (country === 'NG' || country === 'GH' || country === 'ZA') {
        const verification = await PaystackService.verifyAccount(accountNumber, bankCode);
        return {
          success: true,
          accountName: verification.accountName
        };
      } else {
        // For other countries like Kenya, account verification is not available
        return {
          success: false,
          error: 'Account verification not available for this country'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Account verification failed'
      };
    }
  }

  /**
   * Get list of banks for a country
   */
  static async getBanks(country: string) {
    const banks = {
      'KE': [
        { name: 'Equity Bank', code: '68', country: 'KE', currency: 'KES' },
        { name: 'KCB Bank', code: '01', country: 'KE', currency: 'KES' },
        { name: 'Cooperative Bank', code: '11', country: 'KE', currency: 'KES' },
        { name: 'ABSA Bank', code: '03', country: 'KE', currency: 'KES' },
        { name: 'Standard Chartered', code: '02', country: 'KE', currency: 'KES' },
        { name: 'NCBA Bank', code: '07', country: 'KE', currency: 'KES' },
        { name: 'Stanbic Bank', code: '31', country: 'KE', currency: 'KES' },
        { name: 'Diamond Trust Bank', code: '63', country: 'KE', currency: 'KES' },
        { name: 'I&M Bank', code: '57', country: 'KE', currency: 'KES' },
        { name: 'Family Bank', code: '70', country: 'KE', currency: 'KES' }
      ],
      'NG': [
        { name: 'Access Bank', code: '044', country: 'NG', currency: 'NGN' },
        { name: 'GTBank', code: '058', country: 'NG', currency: 'NGN' },
        { name: 'Zenith Bank', code: '057', country: 'NG', currency: 'NGN' },
        { name: 'First Bank', code: '011', country: 'NG', currency: 'NGN' },
        { name: 'UBA', code: '033', country: 'NG', currency: 'NGN' },
        { name: 'Fidelity Bank', code: '070', country: 'NG', currency: 'NGN' },
        { name: 'FCMB', code: '214', country: 'NG', currency: 'NGN' },
        { name: 'Stanbic IBTC', code: '221', country: 'NG', currency: 'NGN' },
        { name: 'Sterling Bank', code: '232', country: 'NG', currency: 'NGN' },
        { name: 'Wema Bank', code: '035', country: 'NG', currency: 'NGN' }
      ],
      'GH': [
        { name: 'GCB Bank', code: 'GCB', country: 'GH', currency: 'GHS' },
        { name: 'Ecobank Ghana', code: 'EBG', country: 'GH', currency: 'GHS' },
        { name: 'Standard Chartered', code: 'SCB', country: 'GH', currency: 'GHS' },
        { name: 'Absa Bank Ghana', code: 'ABG', country: 'GH', currency: 'GHS' },
        { name: 'Fidelity Bank Ghana', code: 'FBG', country: 'GH', currency: 'GHS' }
      ],
      'ZA': [
        { name: 'Standard Bank', code: '051001', country: 'ZA', currency: 'ZAR' },
        { name: 'ABSA Bank', code: '632005', country: 'ZA', currency: 'ZAR' },
        { name: 'FNB', code: '250655', country: 'ZA', currency: 'ZAR' },
        { name: 'Nedbank', code: '198765', country: 'ZA', currency: 'ZAR' },
        { name: 'Capitec Bank', code: '470010', country: 'ZA', currency: 'ZAR' }
      ]
    };

    return banks[country as keyof typeof banks] || [];
  }

  /**
   * Get list of supported countries
   */
  static async getCountries() {
    return [
      { code: 'KE', name: 'Kenya', currency: 'KES', accountType: 'bank_account' },
      { code: 'NG', name: 'Nigeria', currency: 'NGN', accountType: 'nuban' },
      { code: 'GH', name: 'Ghana', currency: 'GHS', accountType: 'mobile_money' },
      { code: 'ZA', name: 'South Africa', currency: 'ZAR', accountType: 'bank_account' }
    ];
  }
}
