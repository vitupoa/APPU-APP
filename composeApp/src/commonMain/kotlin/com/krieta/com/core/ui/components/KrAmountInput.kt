package com.krieta.com.core.ui.components

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue


import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.krieta.com.core.theme.KrietaColors
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.com.core.util.SafeConversion

/**
 * Input field for entering amounts in the user's local fiat currency with
 * real-time Kr conversion displayed as they type.
 *
 * User always enters in fiat (whole numbers only) → conversion to Kr shown below.
 */
@Composable
fun KrAmountInput(
    currencyCode: String,
    exchangeRate: Double,
    onAmountChanged: (fiatAmount: Double, krAmount: Double) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Amount",
    applyMargin: Boolean = true,
    initialFiatAmount: Int? = null
) {
    var inputText by remember { mutableStateOf(initialFiatAmount?.toString() ?: "") }

    // Update input text when initialFiatAmount changes externally (quick-tip buttons)
    LaunchedEffect(initialFiatAmount) {
        if (initialFiatAmount != null && initialFiatAmount > 0) {
            inputText = initialFiatAmount.toString()
        }
    }

    val fiatAmount by remember(inputText) {
        derivedStateOf { 
            SafeConversion.toDoubleOrDefault(
                value = inputText.ifEmpty { "0" },
                fieldName = "fiatAmount",
                defaultValue = 0.0
            )
        }
    }

    val krAmount by remember(fiatAmount, exchangeRate) {
        derivedStateOf {
            KrCurrencyFormatter.fiatToKr(fiatAmount, exchangeRate, applyMargin)
        }
    }

    // Fire callback whenever the computed krAmount actually changes
    LaunchedEffect(fiatAmount, krAmount) {
        onAmountChanged(fiatAmount, krAmount)
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        OutlinedTextField(
            value = inputText,
            onValueChange = { value ->
                // SECURITY: Only allow whole numbers (digits only, no decimals)
                if (value.isEmpty() || value.matches(Regex("^\\d+$"))) {
                    // Cap at reasonable length to prevent overflow
                    if (value.length <= 10) {
                        inputText = value
                    }
                }
            },
            label = { Text(label) },
            prefix = { Text("$currencyCode ", color = MaterialTheme.colorScheme.onSurfaceVariant) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = KrietaColors.Primary,
                cursorColor = KrietaColors.Primary,
                focusedLabelColor = KrietaColors.Primary
            )
        )

        if (fiatAmount > 0) {
            Text(
                text = "≈ ${KrCurrencyFormatter.formatKr(krAmount)}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = KrietaColors.KrGold
            )
        }
    }
}
