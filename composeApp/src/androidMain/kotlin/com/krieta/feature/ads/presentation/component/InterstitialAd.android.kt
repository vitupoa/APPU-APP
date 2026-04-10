package com.krieta.feature.ads.presentation.component

/**
 * Android AdMob interstitial ad implementation.
 * Requires Google Mobile Ads SDK in build.gradle.kts.
 *
 * TODO: Wire AdMob SDK when ad unit IDs are provisioned.
 * - Initialize MobileAds in Application.onCreate()
 * - Use AdRequest.Builder().build() to load
 * - InterstitialAd.load(context, adUnitId, adRequest, callback)
 */
actual class InterstitialAdManager {
    private var isAdLoaded = false

    actual fun load(adUnitId: String) {
        // TODO: Implement with com.google.android.gms.ads.interstitial.InterstitialAd
        isAdLoaded = false
    }

    actual fun show(onDismissed: () -> Unit, onFailed: (String) -> Unit) {
        if (!isAdLoaded) {
            onFailed("Ad not loaded")
            return
        }
        // TODO: Show interstitial via InterstitialAd.show(activity)
        onDismissed()
    }

    actual fun isLoaded(): Boolean = isAdLoaded
}
