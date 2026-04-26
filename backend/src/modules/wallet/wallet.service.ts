import { prisma } from '../../config/database.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { Prisma } from '../../generated/prisma/client.js';

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

    return users.map(u => ({
      ...u,
      isLovers: false // Adjust if necessary
    }));
  }
}
