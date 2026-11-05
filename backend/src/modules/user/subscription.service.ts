import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

const SUBSCRIPTION_PLATFORM_FEE = 0.15; // 15%

export class SubscriptionService {
  /**
   * Get creator's subscription tier config.
   */
  static async getCreatorTiers(creatorId: string) {
    return prisma.subscription_tier.findMany({
      where: { creator_id: creatorId },
      orderBy: { tier: 'asc' }
    });
  }

  /**
   * Get available tiers for a user (public — for subscriber view).
   */
  static async getAvailableTiers(creatorId: string) {
    return prisma.subscription_tier.findMany({
      where: { creator_id: creatorId, is_enabled: true },
      orderBy: { tier: 'asc' }
    });
  }

  /**
   * Creator updates their tier config (upsert up to 4 tiers).
   */
  static async updateTiers(creatorId: string, tiers: {
    tier: string;
    krAmount: number;
    benefits: string;
    isEnabled: boolean;
  }[]) {
    return prisma.$transaction(async (tx) => {
      for (const t of tiers) {
        await tx.subscriptionTier.upsert({
          where: { creator_id_tier: { creator_id: creatorId, tier: t.tier as any } },
          create: {
            creator_id: creatorId,
            tier: t.tier as any,
            kr_amount: new Prisma.Decimal(t.krAmount),
            benefits: t.benefits,
            is_enabled: t.isEnabled
          },
          update: {
            kr_amount: new Prisma.Decimal(t.krAmount),
            benefits: t.benefits,
            is_enabled: t.isEnabled
          }
        });
      }
      return tx.subscriptionTier.findMany({ where: { creator_id: creatorId }, orderBy: { tier: 'asc' } });
    });
  }

  /**
   * Subscribe to a creator's tier. Charges subscriber wallet, credits creator (minus platform fee).
   */
  static async subscribe(subscriberId: string, creatorId: string, tierType: string) {
    if (subscriberId === creatorId) throw new Error('Cannot subscribe to yourself');

    return prisma.$transaction(async (tx) => {
      const tier = await tx.subscriptionTier.findUniqueOrThrow({
        where: { creator_id_tier: { creator_id: creatorId, tier: tierType as any } }
      });
      if (!tier.is_enabled) throw new Error('This tier is not available');

      // Check subscriber balance
      const subscriberWallet = await tx.wallets.findUnique({ where: { user_id: subscriberId } });
      if (!subscriberWallet || subscriberWallet.kr_balance.lessThan(tier.kr_amount)) {
        throw new Error(`Insufficient balance. Need Rc.${tier.kr_amount.toFixed(2)}`);
      }

      // Check for existing active subscription
      const existing = await tx.subscriptions.findUnique({
        where: { subscriber_id_creator_id: { subscriber_id: subscriberId, creator_id: creatorId } }
      });
      if (existing && existing.status === 'active') {
        throw new Error('Already subscribed to this creator');
      }

      const platformFee = tier.kr_amount.mul(SUBSCRIPTION_PLATFORM_FEE);
      const creatorCredit = tier.kr_amount.sub(platformFee);

      // Deduct from subscriber
      await tx.wallets.update({
        where: { user_id: subscriberId },
        data: { kr_balance: { decrement: tier.kr_amount } }
      });

      // Credit creator (minus platform fee)
      await tx.wallets.upsert({
        where: { user_id: creatorId },
        create: { user_id: creatorId, kr_balance: creatorCredit, updated_at: new Date() },
        update: { kr_balance: { increment: creatorCredit } }
      });

      // Record transactions
      await tx.transactions.createMany({
        data: [
          {
            user_id: subscriberId,
            type: 'subscription_paid',
            amount_kr: tier.kr_amount,
            status: 'completed',
            provider: 'platform',
            counterparty_id: creatorId,
            reference: tier.id
          },
          {
            user_id: creatorId,
            type: 'subscription_earned',
            amount_kr: creatorCredit,
            status: 'completed',
            provider: 'platform',
            counterparty_id: subscriberId,
            reference: tier.id
          }
        ]
      });

      // Unlock wallet on first income
      await tx.user.update({
        where: { id: creatorId },
        data: { is_wallet_unlocked: true }
      });

      // Create subscription record
      const now = new Date();
      const nextBilling = new Date(now);
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      const subscription = await tx.subscriptions.upsert({
        where: { subscriber_id_creator_id: { subscriber_id: subscriberId, creator_id: creatorId } },
        create: {
          subscriber_id: subscriberId,
          creator_id: creatorId,
          tier_id: tier.id,
          tier: tierType as any,
          kr_amount: tier.kr_amount,
          status: 'active',
          next_billing_at: nextBilling
        },
        update: {
          tier_id: tier.id,
          tier: tierType as any,
          kr_amount: tier.kr_amount,
          status: 'active',
          next_billing_at: nextBilling,
          cancelled_at: null
        }
      });

      return subscription;
    });
  }

  /**
   * Unsubscribe from a creator.
   */
  static async unsubscribe(subscriberId: string, creatorId: string) {
    const subscription = await prisma.subscriptions.findUnique({
      where: { subscriber_id_creator_id: { subscriber_id: subscriberId, creator_id: creatorId } }
    });
    if (!subscription || subscription.status !== 'active') {
      throw new Error('No active subscription found');
    }

    return prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', cancelled_at: new Date() }
    });
  }

  /**
   * Check if subscriber has access to content at a given tier level.
   */
  static async hasAccess(subscriberId: string, creatorId: string, requiredTier: string): Promise<boolean> {
    const tierOrder = ['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN'];
    const requiredIndex = tierOrder.indexOf(requiredTier);

    const subscription = await prisma.subscriptions.findUnique({
      where: { subscriber_id_creator_id: { subscriber_id: subscriberId, creator_id: creatorId } }
    });

    if (!subscription || subscription.status !== 'active') return false;

    const subscribedIndex = tierOrder.indexOf(subscription.tier);
    return subscribedIndex >= requiredIndex;
  }
}
