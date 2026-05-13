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
      prisma.wallets.update({
        where: { user_id: userId },
        data: { kr_balance: { increment: amount } }
      }),
      prisma.transactions.create({
        data: {
          user_id: userId,
          type: 'ad_revenue',
          amount_kr: amount,
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

      await prisma.daily_stats.upsert({
        where: { user_id_date: { user_id: data.userId, date: today } },
        create: {
          user_id: data.userId,
          date: today,
          views: 0,
          likes: 0,
          new_admirers: 0,
          kr_earned: data.adType === 'rewarded' ? 0.5 : 0,
          kr_spent: 0
        },
        update: {
          kr_earned: { increment: data.adType === 'rewarded' ? 0.5 : 0 }
        }
      }).catch(() => {});
    }
  }
}
