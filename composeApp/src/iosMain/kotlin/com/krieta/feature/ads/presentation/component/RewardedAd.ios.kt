package com.krieta.feature.ads.presentation.component

/**
 * iOS AdMob rewarded ad implementation.
 * TODO: Wire Google Mobile Ads SDK for iOS when ad unit IDs are provisioned.
 */
actual class RewardedAdManager {
    private var isAdLoaded = false

    actual fun load(adUnitId: String) {
        // TODO: Implement with GADRewardedAd
        isAdLoaded = false
    }

    actual fun show(onRewarded: (rewardAmount: Int) -> Unit, onDismissed: () -> Unit, onFailed: (String) -> Unit) {
        if (!isAdLoaded) {
            onFailed("Ad not loaded")
            return
        }
        onRewarded(1)
        onDismissed()
    }

    actual fun isLoaded(): Boolean = isAdLoaded
}
