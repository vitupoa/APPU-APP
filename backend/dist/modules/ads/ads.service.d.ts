/**
 * Ads service — handles rewarded ad credit recording and ad impression tracking.
 * When a user watches a rewarded ad, we credit their wallet with a small Kr amount
 * and record it as an ad_revenue transaction.
 */
export declare class AdsService {
    /**
     * Credit user wallet for watching a rewarded ad.
     * Atomic: creates transaction + increments wallet balance.
     */
    static creditRewardedAd(userId: string, rewardKr?: number): Promise<{
        credited: number;
    }>;
    /**
     * Record an ad impression for analytics tracking.
     * Non-blocking, fire-and-forget.
     */
    static recordImpression(data: {
        userId?: string;
        adUnitId: string;
        adType: 'native' | 'interstitial' | 'rewarded';
        placement: string;
    }): Promise<void>;
}
//# sourceMappingURL=ads.service.d.ts.map