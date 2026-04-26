package com.krieta.feature.ads.presentation.component

/**
 * DEPRECATED: AdMob removed
 * Use SponsoredContentManager for native sponsored content
 */
@Deprecated("Use SponsoredContentManager")
actual class InterstitialAdManager {
    actual fun load(adUnitId: String) {}
    actual fun show(onDismissed: () -> Unit, onFailed: (String) -> Unit) {
        onFailed("AdMob removed")
    }
    actual fun isLoaded(): Boolean = false
}
