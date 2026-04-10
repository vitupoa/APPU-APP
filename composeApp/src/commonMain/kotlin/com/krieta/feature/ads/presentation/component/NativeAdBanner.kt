package com.krieta.feature.ads.presentation.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * In-feed native ad banner placed between content items.
 * Wraps platform-specific ad SDK (AdMob on Android, AdMob/AppLovin on iOS).
 *
 * Platform-specific implementation will be injected via expect/actual
 * when AdMob SDK is configured. This placeholder ensures the UI slot is ready.
 */
@Composable
fun NativeAdBanner(
    adUnitId: String,
    modifier: Modifier = Modifier
) {
    // Placeholder until AdMob SDK is wired via expect/actual
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(80.dp)
            .background(
                MaterialTheme.colorScheme.surfaceVariant,
                RoundedCornerShape(12.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "Sponsored",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
            )
            Text(
                "Ad",
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
