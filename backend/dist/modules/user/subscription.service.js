import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/client.js';
const SUBSCRIPTION_PLATFORM_FEE = 0.15; // 15%
export class SubscriptionService {
    /**
     * Get creator's subscription tier config.
     */
    static async getCreatorTiers(creatorId) {
        return prisma.subscriptionTier.findMany({
            where: { creatorId },
            orderBy: { tier: 'asc' }
        });
    }
    /**
     * Get available tiers for a user (public — for subscriber view).
     */
    static async getAvailableTiers(creatorId) {
        return prisma.subscriptionTier.findMany({
            where: { creatorId, isEnabled: true },
            orderBy: { tier: 'asc' }
        });
    }
    /**
     * Creator updates their tier config (upsert up to 4 tiers).
     */
    static async updateTiers(creatorId, tiers) {
        return prisma.$transaction(async (tx) => {
            for (const t of tiers) {
                await tx.subscriptionTier.upsert({
                    where: { creatorId_tier: { creatorId, tier: t.tier } },
                    create: {
                        creatorId,
                        tier: t.tier,
                        krAmount: new Prisma.Decimal(t.krAmount),
                        benefits: t.benefits,
                        isEnabled: t.isEnabled
                    },
                    update: {
                        krAmount: new Prisma.Decimal(t.krAmount),
                        benefits: t.benefits,
                        isEnabled: t.isEnabled
                    }
                });
            }
            return tx.subscriptionTier.findMany({ where: { creatorId }, orderBy: { tier: 'asc' } });
        });
    }
    /**
     * Subscribe to a creator's tier. Charges subscriber wallet, credits creator (minus platform fee).
     */
    static async subscribe(subscriberId, creatorId, tierType) {
        if (subscriberId === creatorId)
            throw new Error('Cannot subscribe to yourself');
        return prisma.$transaction(async (tx) => {
            const tier = await tx.subscriptionTier.findUniqueOrThrow({
                where: { creatorId_tier: { creatorId, tier: tierType } }
            });
            if (!tier.isEnabled)
                throw new Error('This tier is not available');
            // Check subscriber balance
            const subscriberWallet = await tx.wallet.findUnique({ where: { userId: subscriberId } });
            if (!subscriberWallet || subscriberWallet.krBalance.lessThan(tier.krAmount)) {
                throw new Error(`Insufficient balance. Need Kr.${tier.krAmount.toFixed(2)}`);
            }
            // Check for existing active subscription
            const existing = await tx.subscription.findUnique({
                where: { subscriberId_creatorId: { subscriberId, creatorId } }
            });
            if (existing && existing.status === 'active') {
                throw new Error('Already subscribed to this creator');
            }
            const platformFee = tier.krAmount.mul(SUBSCRIPTION_PLATFORM_FEE);
            const creatorCredit = tier.krAmount.sub(platformFee);
            // Deduct from subscriber
            await tx.wallet.update({
                where: { userId: subscriberId },
                data: { krBalance: { decrement: tier.krAmount } }
            });
            // Credit creator (minus platform fee)
            await tx.wallet.upsert({
                where: { userId: creatorId },
                create: { userId: creatorId, krBalance: creatorCredit },
                update: { krBalance: { increment: creatorCredit } }
            });
            // Record transactions
            await tx.transaction.createMany({
                data: [
                    {
                        userId: subscriberId,
                        type: 'subscription_paid',
                        amountKr: tier.krAmount,
                        status: 'completed',
                        provider: 'platform',
                        counterpartyId: creatorId,
                        reference: tier.id
                    },
                    {
                        userId: creatorId,
                        type: 'subscription_earned',
                        amountKr: creatorCredit,
                        status: 'completed',
                        provider: 'platform',
                        counterpartyId: subscriberId,
                        reference: tier.id
                    }
                ]
            });
            // Unlock wallet on first income
            await tx.user.update({
                where: { id: creatorId },
                data: { isWalletUnlocked: true }
            });
            // Create subscription record
            const now = new Date();
            const nextBilling = new Date(now);
            nextBilling.setMonth(nextBilling.getMonth() + 1);
            const subscription = await tx.subscription.upsert({
                where: { subscriberId_creatorId: { subscriberId, creatorId } },
                create: {
                    subscriberId,
                    creatorId,
                    tierId: tier.id,
                    tier: tierType,
                    krAmount: tier.krAmount,
                    status: 'active',
                    nextBillingAt: nextBilling
                },
                update: {
                    tierId: tier.id,
                    tier: tierType,
                    krAmount: tier.krAmount,
                    status: 'active',
                    nextBillingAt: nextBilling,
                    cancelledAt: null
                }
            });
            return subscription;
        });
    }
    /**
     * Unsubscribe from a creator.
     */
    static async unsubscribe(subscriberId, creatorId) {
        const subscription = await prisma.subscription.findUnique({
            where: { subscriberId_creatorId: { subscriberId, creatorId } }
        });
        if (!subscription || subscription.status !== 'active') {
            throw new Error('No active subscription found');
        }
        return prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'cancelled', cancelledAt: new Date() }
        });
    }
    /**
     * Check if subscriber has access to content at a given tier level.
     */
    static async hasAccess(subscriberId, creatorId, requiredTier) {
        const tierOrder = ['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN'];
        const requiredIndex = tierOrder.indexOf(requiredTier);
        const subscription = await prisma.subscription.findUnique({
            where: { subscriberId_creatorId: { subscriberId, creatorId } }
        });
        if (!subscription || subscription.status !== 'active')
            return false;
        const subscribedIndex = tierOrder.indexOf(subscription.tier);
        return subscribedIndex >= requiredIndex;
    }
}
//# sourceMappingURL=subscription.service.js.map