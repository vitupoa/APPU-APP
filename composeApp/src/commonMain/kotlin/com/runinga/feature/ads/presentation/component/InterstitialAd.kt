package com.runinga.feature.ads.presentation.component

/**
 * DEPRECATED: Replaced by SponsoredContentManager
 * AdMob interstitials removed in favor of native sponsored content
 */
@Deprecated("Use SponsoredContentManager instead", ReplaceWith("SponsoredContentManager"))
expect class InterstitialAdManager() {
    fun load(adUnitId: String)
    fun show(onDismissed: () -> Unit, onFailed: (String) -> Unit)
    fun isLoaded(): Boolean
}
