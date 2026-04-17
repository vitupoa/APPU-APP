import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/client.js';

/**
 * Ads service — handles rewarded ad credit recording and ad impression tracking.
 * When a user watches a rewarded ad, we credit their wallet with a small Kr amount
 * and record it as an ad_revenue transaction.
 */
export class AdsService {
  /**
   * Credit user wallet for watching a rewarded ad.
   * Atomic: creates transaction + increments wallet balance.
   */
  static async creditRewardedAd(userId: string, rewardKr: number = 0.5) {
    const amount = new Prisma.Decimal(rewardKr);

    await prisma.$transaction([
      // Credit wallet
      prisma.wallet.update({
        where: { userId },
        data: { krBalance: { increment: amount } }
      }),
      // Record transaction
      prisma.transaction.create({
        data: {
          userId,
          type: 'ad_revenue',
          amountKr: amount,
          status: 'completed',
          provider: 'platform',
          reference: `rewarded_ad_${Date.now()}`
        }
      })
    ]);

    return { credited: rewardKr };
  }

  /**
   * Record an ad impression for analytics tracking.
   * Non-blocking, fire-and-forget.
   */
  static async recordImpression(data: {
    userId?: string;
    adUnitId: string;
    adType: 'native' | 'interstitial' | 'rewarded';
    placement: string;
  }) {
    // Record to daily stats for analytics
    if (data.userId && data.adType === 'rewarded') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyStat.upsert({
        where: { userId_date: { userId: data.userId, date: today } },
        create: {
          userId: data.userId,
          date: today,
          views: 0,
          likes: 0,
          newAdmirers: 0,
          krEarned: data.adType === 'rewarded' ? 0.5 : 0,
          krSpent: 0
        },
        update: {
          krEarned: { increment: data.adType === 'rewarded' ? 0.5 : 0 }
        }
      }).catch(() => {}); // Non-critical, don't fail
    }
  }
}
