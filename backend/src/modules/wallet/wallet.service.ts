import { prisma } from '../../config/database';
import { ExchangeService } from '../../services/exchange/exchange.service';
import { Prisma } from '@prisma/client';

export class WalletService {
  /**
   * Retrieves the wallet balance ensuring a wallet exists.
   */
  static async getBalance(userId: string) {
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

    // Convert Kr balance to user fiat equivalent contextually
    const fiatRate = await ExchangeService.getRate(wallet.user.currency);
    const fiatEquivalent = Number(wallet.krBalance) * fiatRate;

    return {
      krBalance: wallet.krBalance,
      fiatEquivalent,
      currency: wallet.user.currency,
      isWalletUnlocked: wallet.user.isWalletUnlocked
    };
  }

  /**
   * Transfers a Tip from one user to another atomically.
   */
  static async sendTip(senderId: string, recipientId: string, fiatAmount: number, senderCurrency: string) {
    if (senderId === recipientId) {
      throw new Error("You cannot tip yourself");
    }

    // Rate: How much Kr does this Fiat buy?
    // Using buy margin because they are purchasing Kr functionally to tip
    const rate = await ExchangeService.getTransactionRate(senderCurrency, 'buy');
    const krAmount = new Prisma.Decimal(fiatAmount / rate);

    if (krAmount.lessThan(0.1)) {
      throw new Error("Tip amount is too small");
    }

    // Execute atomic transaction for balance safety
    return prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({ where: { userId: senderId } });
      if (!senderWallet || senderWallet.krBalance.lessThan(krAmount)) {
        throw new Error("Insufficient Kr balance to tip");
      }

      // Deduct Sender
      await tx.wallet.update({
        where: { userId: senderId },
        data: { krBalance: { decrement: krAmount } }
      });

      // Credit Recipient
      const recipientWallet = await tx.wallet.upsert({
        where: { userId: recipientId },
        create: { userId: recipientId, krBalance: krAmount },
        update: { krBalance: { increment: krAmount } }
      });

      // Record Transactions
      await tx.transaction.createMany({
        data: [
          {
            userId: senderId,
            counterpartyId: recipientId,
            type: 'tip_sent',
            amountKr: krAmount,
            amountFiat: fiatAmount,
            currency: senderCurrency,
            status: 'completed',
            provider: 'platform'
          },
          {
            userId: recipientId,
            counterpartyId: senderId,
            type: 'tip_received',
            amountKr: krAmount,
            status: 'completed',
            provider: 'platform'
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
        krTipped: krAmount
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
}
