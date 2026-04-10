package com.krieta.feature.ads.presentation.component

/**
 * Rewarded ad — user watches a video ad to earn Kr reward.
 * Uses expect/actual for platform-specific AdMob rewarded ad.
 */
expect class RewardedAdManager {
    fun load(adUnitId: String)
    fun show(onRewarded: (rewardAmount: Int) -> Unit, onDismissed: () -> Unit, onFailed: (String) -> Unit)
    fun isLoaded(): Boolean
}
