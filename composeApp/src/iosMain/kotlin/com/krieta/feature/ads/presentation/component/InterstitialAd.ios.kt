package com.krieta.feature.ads.presentation.component

/**
 * iOS AdMob interstitial ad implementation.
 * TODO: Wire Google Mobile Ads SDK for iOS when ad unit IDs are provisioned.
 */
actual class InterstitialAdManager {
    private var isAdLoaded = false

    actual fun load(adUnitId: String) {
        // TODO: Implement with GADInterstitialAd
        isAdLoaded = false
    }

    actual fun show(onDismissed: () -> Unit, onFailed: (String) -> Unit) {
        if (!isAdLoaded) {
            onFailed("Ad not loaded")
            return
        }
        onDismissed()
    }

    actual fun isLoaded(): Boolean = isAdLoaded
}
