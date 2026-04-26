package com.krieta.feature.ads.presentation.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.krieta.feature.sponsored.presentation.SponsoredBadge

/**
 * DEPRECATED: Replaced by native sponsored shorts in feed
 * Use SponsoredContentManager to fetch sponsored content that looks identical to regular content
 */
@Deprecated("Use SponsoredContentManager for native sponsored content")
@Composable
fun NativeAdBanner(
    adUnitId: String,
    modifier: Modifier = Modifier
) {
    // No-op: Sponsored content is now injected directly into feed
    // Use SponsoredBadge() overlay on actual content instead
}
