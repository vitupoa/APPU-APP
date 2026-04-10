package com.krieta.feature.ads.presentation.component

/**
 * Android AdMob rewarded ad implementation.
 * TODO: Wire AdMob SDK when ad unit IDs are provisioned.
 */
actual class RewardedAdManager {
    private var isAdLoaded = false

    actual fun load(adUnitId: String) {
        // TODO: Implement with com.google.android.gms.ads.rewarded.RewardedAd
        isAdLoaded = false
    }

    actual fun show(onRewarded: (rewardAmount: Int) -> Unit, onDismissed: () -> Unit, onFailed: (String) -> Unit) {
        if (!isAdLoaded) {
            onFailed("Ad not loaded")
            return
        }
        // TODO: Show rewarded ad via RewardedAd.show(activity, rewardCallback)
        onRewarded(1) // Default 1 Kr reward
        onDismissed()
    }

    actual fun isLoaded(): Boolean = isAdLoaded
}
