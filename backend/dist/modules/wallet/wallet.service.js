"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const database_1 = require("../../config/database");
const exchange_service_1 = require("../../services/exchange/exchange.service");
const client_1 = require("@prisma/client");
class WalletService {
    /**
     * Retrieves the wallet balance ensuring a wallet exists.
     */
    static async getBalance(userId) {
        let wallet = await database_1.prisma.wallet.findUnique({
            where: { userId },
            include: { user: { select: { isWalletUnlocked: true, currency: true } } }
        });
        if (!wallet) {
            wallet = await database_1.prisma.wallet.create({
                data: { userId },
                include: { user: { select: { isWalletUnlocked: true, currency: true } } }
            });
        }
        // Convert Kr balance to user fiat equivalent contextually
        const fiatRate = await exchange_service_1.ExchangeService.getRate(wallet.user.currency);
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
    static async sendTip(senderId, recipientId, fiatAmount, senderCurrency) {
        if (senderId === recipientId) {
            throw new Error("You cannot tip yourself");
        }
        // Rate: How much Kr does this Fiat buy?
        // Using buy margin because they are purchasing Kr functionally to tip
        const rate = await exchange_service_1.ExchangeService.getTransactionRate(senderCurrency, 'buy');
        const krAmount = new client_1.Prisma.Decimal(fiatAmount / rate);
        if (krAmount.lessThan(0.1)) {
            throw new Error("Tip amount is too small");
        }
        // Execute atomic transaction for balance safety
        return database_1.prisma.$transaction(async (tx) => {
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
    static async getTransactions(userId, limit = 20, offset = 0) {
        const transactions = await database_1.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });
        return transactions;
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map