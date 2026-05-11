import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

/**
 * DEPRECATED: Ads service for rewarded video ads (AdMob)
 * Replaced by SponsoredContentService for native sponsored content
 * 
 * Keep this for backward compatibility if needed
 */
export class AdsService {
  /**
   * Credit user wallet for watching a rewarded ad.
   * @deprecated Use SponsoredContentService instead
   */
  static async creditRewardedAd(userId: string, rewardKr: number = 0.5) {
    const amount = new Prisma.Decimal(rewardKr);

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId },
        data: { krBalance: { increment: amount } }
      }),
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
   * @deprecated Use SponsoredContentService.recordImpression instead
   */
  static async recordImpression(data: {
    userId?: string;
    adUnitId: string;
    adType: 'native' | 'interstitial' | 'rewarded';
    placement: string;
  }) {
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
      }).catch(() => {});
    }
  }
}
