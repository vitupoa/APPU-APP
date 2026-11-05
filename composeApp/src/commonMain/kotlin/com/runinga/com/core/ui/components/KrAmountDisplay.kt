package com.runinga.com.core.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.runinga.com.core.theme.RuningaColors

/**
 * Displays a Rc amount with fiat equivalent below.
 * Format: Rc. 500 (~KES 850) — always dot space between symbol and amount.
 *
 * @param krAmount The amount in Rc
 * @param fiatAmount The equivalent in user's local fiat currency
 * @param currencyCode ISO currency code (e.g., "KES", "NGN")
 * @param showFiat Whether to show the fiat equivalent (default: true)
 * @param large Whether to use large typography (for balance cards)
 */
@Composable
fun RcAmountDisplay(
    krAmount: Double,
    fiatAmount: Double,
    currencyCode: String,
    modifier: Modifier = Modifier,
    showFiat: Boolean = true,
    large: Boolean = false
) {
    val krText = com.runinga.com.core.util.KrCurrencyFormatter.formatKr(krAmount)
    val fiatText = com.runinga.com.core.util.KrCurrencyFormatter.formatFiat(fiatAmount, currencyCode)

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(
            text = krText,
            style = if (large) MaterialTheme.typography.headlineLarge else MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = RuningaColors.KrGold
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
