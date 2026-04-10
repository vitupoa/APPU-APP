package com.krieta.com.core.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.krieta.com.core.theme.KrietaColors

/**
 * Displays a Kr amount with fiat equivalent below.
 * Format: Kr.500 (~KES 850) — always dot between symbol and amount, no space.
 *
 * @param krAmount The amount in Kr
 * @param fiatAmount The equivalent in user's local fiat currency
 * @param currencyCode ISO currency code (e.g., "KES", "NGN")
 * @param showFiat Whether to show the fiat equivalent (default: true)
 * @param large Whether to use large typography (for balance cards)
 */
@Composable
fun KrAmountDisplay(
    krAmount: Double,
    fiatAmount: Double,
    currencyCode: String,
    modifier: Modifier = Modifier,
    showFiat: Boolean = true,
    large: Boolean = false
) {
    val krText = com.krieta.com.core.util.KrCurrencyFormatter.formatKr(krAmount)
    val fiatText = com.krieta.com.core.util.KrCurrencyFormatter.formatFiat(fiatAmount, currencyCode)

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(
            text = krText,
            style = if (large) MaterialTheme.typography.headlineLarge else MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = KrietaColors.KrGold
        )
        if (showFiat) {
            Text(
                text = "(~$fiatText)",
                style = if (large) MaterialTheme.typography.bodyLarge else MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
