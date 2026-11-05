package com.runinga.feature.ads.presentation.component

/**
 * DEPRECATED: Replaced by SponsoredContentManager
 * AdMob rewarded ads removed in favor of native sponsored content
 */
@Deprecated("Use SponsoredContentManager instead", ReplaceWith("SponsoredContentManager"))
expect class RewardedAdManager() {
    fun load(adUnitId: String)
    fun show(onRewarded: (Int) -> Unit, onDismissed: () -> Unit, onFailed: (String) -> Unit)
    fun isLoaded(): Boolean
}
