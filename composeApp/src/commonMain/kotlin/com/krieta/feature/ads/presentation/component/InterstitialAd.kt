package com.krieta.feature.ads.presentation.component

/**
 * Interstitial ad shown between content transitions (e.g. after scrolling N shorts).
 * Uses expect/actual for platform-specific AdMob interstitial.
 */
expect class InterstitialAdManager {
    fun load(adUnitId: String)
    fun show(onDismissed: () -> Unit, onFailed: (String) -> Unit)
    fun isLoaded(): Boolean
}
