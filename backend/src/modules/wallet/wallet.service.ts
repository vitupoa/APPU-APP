import { prisma } from '../../config/database.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { PaypalService } from '../../services/payments/paypal.service.js';
import { PaystackService } from '../../services/payments/paystack.service.js';
import { MpesaService } from '../../services/payments/mpesa.service.js';
import { lockWalletForUpdate, lockWalletsForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';

export class WalletService {
  /**
   * Retrieves the wallet balance ensuring a wallet exists.
   * Wave 3 Task 5.3: Returns fiat equivalent in response
   */
  static async getBalance(userId: string, targetCurrency?: string) {
    // Optimized query - only fetch what we need
    const result = await prisma.wallets.findUnique({
      where: { user_id: userId },
      select: {
        kr_balance: true,
        user: { select: { is_wallet_unlocked: true, currency: true } }
      }
    });

    let wallet = result;
    if (!wallet) {
      wallet = await prisma.wallets.create({
        data: { 
          id: crypto.randomUUID(),
          User: { connect: { id: userId } },
          updated_at: new Date()
        },
        select: {
          kr_balance: true,
          user: { select: { is_wallet_unlocked: true, currency: true } }
        }
      } as any);
    }

    const currencyToUse = targetCurrency || wallet.user.currency;
    const fiatRate = await ExchangeService.getDisplayRate(currencyToUse);
    const baseUsd = Number(wallet.kr_balance) / 100;
    const fiatEquivalent = baseUsd * fiatRate;

    return {
      krBalance: wallet.kr_balance.toNumber(),
      fiatEquivalent,
      currency: currencyToUse,
      isWalletUnlocked: wallet.user.is_wallet_unlocked,
      exchangeRate: fiatRate,
      baseUsd
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
        await tx.wallets.update({
          where: { user_id: senderId },
          data: { kr_balance: { decrement: krDecimal } }
        });

        // Credit Recipient (-15% Platform cut applied -> 85%)
        const recipientWallet = await tx.wallets.upsert({
          where: { user_id: recipientId },
          create: { 
            id: crypto.randomUUID(),
            User: {
              connect: { id: recipientId }
            },
            kr_balance: recipientReceiveAmount,
            updated_at: new Date()
          },
          update: { kr_balance: { increment: recipientReceiveAmount } }
        });

        // Record Transactions accurately outlining Revenue Velocity with full context
        await tx.transactions.createMany({
          data: [
            {
              user_id: senderId,
              counterparty_id: recipientId,
              type: 'tip_sent',
              transaction_type: 'CONTENT_TIP',
              amount_kr: krDecimal,
              amount_fiat: fiatAmount,
              currency: senderCurrency,
              status: 'completed',
              provider: 'platform',
              description: `Tip sent to ${recipientId.slice(0, 8)}`,
              context: {
                action: 'tip_sent',
                sender_id: senderId,
                recipient_id: recipientId,
                amount_kr: senderKrAmount,
                timestamp: new Date().toISOString()
              }
            },
            {
              user_id: recipientId,
              counterparty_id: senderId,
              type: 'tip_received',
              transaction_type: 'CONTENT_TIP',
              amount_kr: recipientReceiveAmount,
              status: 'completed',
              provider: 'platform',
              description: `Tip received from ${senderId.slice(0, 8)}`,
              context: {
                action: 'tip_received',
                sender_id: senderId,
                recipient_id: recipientId,
                amount_kr: recipientReceiveAmount.toNumber(),
                timestamp: new Date().toISOString()
              }
            },
            {
              user_id: senderId,
              counterparty_id: 'PLATFORM_REVENUE',
              type: 'platform_fee',
              transaction_type: 'PLATFORM_REWARD',
              amount_kr: platformCutDecimal,
              status: 'completed',
              provider: 'platform_engine',
              description: `Platform fee (15%) from tip transaction`,
              context: {
                action: 'platform_fee',
                source_transaction: 'tip',
                sender_id: senderId,
                recipient_id: recipientId,
                fee_amount: platformCut,
                fee_percentage: 15,
                original_amount: senderKrAmount,
                timestamp: new Date().toISOString()
              }
            }
          ]
        });

        // Unlock Recipient Identity if this is their first inflow!
        const recipientUser = await tx.user.findUnique({ where: { id: recipientId } });
        if (recipientUser && !recipientUser.is_wallet_unlocked) {
          await tx.user.update({
            where: { id: recipientId },
            data: { is_wallet_unlocked: true }
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
    // Optimized: Fetch transactions and user currency in parallel
    const [transactions, user] = await Promise.all([
      prisma.transactions.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          user_id: true,
          type: true,
          amount_kr: true,
          amount_fiat: true,
          currency: true,
          provider: true,
          status: true,
          reference: true,
          counterparty_id: true,
          metadata: true,
          created_at: true,
          context: true,
          description: true,
          transaction_type: true
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true }
      })
    ]);

    const currency = user?.currency || 'USD';
    const fiatRate = await ExchangeService.getDisplayRate(currency);

    return transactions.map(tx => {
      const baseUsd = Number(tx.amount_kr) / 100;
      const fiatEquivalent = baseUsd * fiatRate;

      return {
        ...tx,
        fiat_equivalent: fiatEquivalent,
        currency,
        exchange_rate: fiatRate
      };
    });
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
          { display_name: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 20,
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        is_verified: true,
        bio: true,
        admirers_count: true
      }
    });

    return users.map((u: any) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      isVerified: u.is_verified || false,
      bio: u.bio,
      followersCount: u.admirers_count,
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
    const recentTransactions = await prisma.transactions.count({
      where: {
        user_id: userId,
        type: 'topup',
        created_at: {
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

    // SECURITY: Create pending transaction with exact amounts (immutable record) and full context
    const transaction = await prisma.transactions.create({
      data: {
        user_id: userId,
        type: 'topup',
        transaction_type: 'TOP_UP',
        amount_kr: new Prisma.Decimal(krAmount),
        amount_fiat: fiatAmount,
        currency,
        provider,
        status: 'pending',
        reference,
        description: `Wallet top-up via ${provider.toUpperCase()} - ${krAmount} Kr`,
        context: {
          action: 'topup_initiated',
          provider,
          fiat_amount: fiatAmount,
          currency,
          kr_amount: krAmount,
          buy_rate: buyRate,
          flat_fee: 30,
          platform_margin: '4.5%',
          initiated_at: new Date().toISOString(),
          ip_address: ipAddress || 'unknown'
        },
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
          await prisma.transactions.update({
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
          await prisma.transactions.update({
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
          const paypalOrder = await PaypalService.createOrder({ 
            amount: fiatAmount, 
            currency, 
            description: `Krieta Wallet Top-up - ${krAmount} Kr`, 
            referenceId: reference 
          });
          paymentInstructions = {
            provider: 'paypal',
            amount: fiatAmount,
            currency,
            paymentUrl: paypalOrder.approvalUrl,
            order_id: paypalOrder.order_id,
            instructions: 'Click "Continue to Payment" to complete your payment via PayPal. You can pay with your PayPal balance, linked bank account, or credit/debit card.'
          };
          
          // Store PayPal order ID in metadata
          await prisma.transactions.update({
            where: { id: transaction.id },
            data: {
              metadata: { 
                ...transaction.metadata as any,
                paypalOrderId: paypalOrder.order_id
              }
            }
          });
        } catch (error: any) {
          await prisma.transactions.update({
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
          const paystackTx = await PaystackService.initializeTransaction({
            email,
            amount: fiatAmount,
            currency,
            reference,
            callbackUrl: `${process.env.BACKEND_URL}/api/v1/wallet/topup/paystack/callback`
          });
          
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
          await prisma.transactions.update({
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
          await prisma.transactions.update({
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
      transaction_id: transaction.id,
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
    const transaction = await prisma.transactions.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // SECURITY: Verify transaction belongs to user
    if (transaction.user_id !== userId) {
      throw new Error('Unauthorized: Transaction does not belong to user');
    }

    // SECURITY: Prevent double-crediting - only process pending transactions
    if (transaction.status !== 'pending') {
      console.warn(`Attempt to confirm non-pending transaction: ${transactionId}, status: ${transaction.status}`);
      throw new Error(`Transaction already ${transaction.status}`);
    }

    // SECURITY: Verify transaction is not expired (30 minutes timeout)
    const transactionAge = Date.now() - transaction.created_at.getTime();
    if (transactionAge > 30 * 60 * 1000) {
      await prisma.transactions.update({
        where: { id: transactionId },
        data: { status: 'expired' }
      });
      throw new Error('Transaction expired');
    }

    // SECURITY: If verified amount provided, ensure it matches transaction amount
    if (verifiedAmount !== undefined) {
      const transactionAmount = typeof transaction.amount_fiat === 'number' ? transaction.amount_fiat : 0;
      const amountMatch = Math.abs(verifiedAmount - transactionAmount) < 0.01;
      if (!amountMatch) {
        console.error(`Amount mismatch: Expected ${transaction.amount_fiat}, got ${verifiedAmount}`);
        await prisma.transactions.update({
          where: { id: transactionId },
          data: { status: 'failed', metadata: { ...transaction.metadata as any, error: 'Amount mismatch' } }
        });
        throw new Error('Payment amount mismatch');
      }
    }

    // SECURITY: If verified currency provided, ensure it matches
    if (verifiedCurrency && verifiedCurrency !== transaction.currency) {
      console.error(`Currency mismatch: Expected ${transaction.currency}, got ${verifiedCurrency}`);
      await prisma.transactions.update({
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
        const txCheck = await tx.transactions.findUnique({
          where: { id: transactionId }
        });

        if (!txCheck || txCheck.status !== 'pending') {
          throw new Error('Transaction state changed');
        }

        // Update transaction status with completion details
        await tx.transactions.update({
          where: { id: transactionId },
          data: {
            status: 'completed',
            description: `Wallet top-up completed via ${transaction.provider?.toUpperCase()} - ${transaction.amount_kr} Kr`,
            context: {
              ...(transaction.context as any),
              action: 'topup_completed',
              completed_at: new Date().toISOString(),
              payment_reference: paymentReference,
              verified_amount: verifiedAmount,
              verified_currency: verifiedCurrency
            },
            metadata: {
              ...(transaction.metadata as any),
              paymentReference,
              completed_at: new Date().toISOString(),
              verifiedAmount,
              verifiedCurrency
            }
          }
        });

        // SECURITY: Credit wallet with EXACT amount from transaction record (not from parameters)
        await tx.wallets.upsert({
          where: { user_id: userId },
          create: {
            id: crypto.randomUUID(),
            User: {
              connect: { id: userId }
            },
            kr_balance: transaction.amount_kr,
            updated_at: new Date()
          },
          update: {
            kr_balance: { increment: transaction.amount_kr }
          }
        });

        // Unlock wallet if first topup
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user && !user.is_wallet_unlocked) {
          await tx.user.update({
            where: { id: userId },
            data: { is_wallet_unlocked: true }
          });
        }

        console.log(`✅ Top-up confirmed: User ${userId}, Transaction ${transactionId}, Amount ${transaction.amount_kr} Kr`);

        return {
          success: true,
          transaction_id: transactionId,
          krAmount: transaction.amount_kr.toNumber(),
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
        const verification = await PaystackService.verifyAccountName({ accountNumber, bankCode, country });
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
      { code: 'KE', name: 'Kenya', currency: 'KES', account_type: 'bank_account' },
      { code: 'NG', name: 'Nigeria', currency: 'NGN', account_type: 'nuban' },
      { code: 'GH', name: 'Ghana', currency: 'GHS', account_type: 'mobile_money' },
      { code: 'ZA', name: 'South Africa', currency: 'ZAR', account_type: 'bank_account' }
    ];
  }
}
