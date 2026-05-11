package com.krieta.com.core.ui.components

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.util.KrCurrencyFormatter

/**
 * Tipping modal where user enters amount in their local fiat currency.
 * Real-time conversion to Kr is displayed. No decimals allowed.
 * Platform fee is deducted silently on the backend — never shown to users.
 *
 * @param onConfirm Called with the integer Kr amount to send to the backend.
 */
@Composable
fun TippingModal(
    recipientUsername: String,
    recipientDisplayName: String,
    currentBalance: Double,
    currencyProvider: UserCurrencyProvider,
    onDismiss: () -> Unit,
    onConfirm: (krAmount: Double) -> Unit,
    onInsufficientBalance: () -> Unit
) {
    var fiatAmount by remember { mutableStateOf(0.0) }
    var krAmount by remember { mutableStateOf(0.0) }
    var selectedQuickFiat by remember { mutableStateOf<Int?>(null) }
    val exchangeRate by currencyProvider.exchangeRate.collectAsState()
    val currencyCode = currencyProvider.currencyCode

    val minTipKr = 1.0
    val krInt = krAmount.toInt()

    // Quick-tip amounts in user's native fiat currency
    val quickFiatAmounts = listOf(500, 1000, 5000, 50000)

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Tip @$recipientUsername",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(painterResource(Res.drawable.ic_close), "Close")
                    }
                }

                Text(
                    recipientDisplayName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Fiat amount input with real-time Kr conversion
                KrAmountInput(
                    currencyCode = currencyCode,
                    exchangeRate = exchangeRate?.baseRate ?: 1.0,
                    onAmountChanged = { fiat, kr ->
                        fiatAmount = fiat
                        krAmount = kr
                    },
                    label = "Tip Amount",
                    applyMargin = false,
                    initialFiatAmount = selectedQuickFiat
                )

                // Quick tip buttons in user's native fiat currency
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    quickFiatAmounts.forEach { amount ->
                        OutlinedButton(
                            onClick = { selectedQuickFiat = amount },
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(horizontal = 2.dp, vertical = 0.dp),
                            border = if (selectedQuickFiat == amount)
                                BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
                            else
                                BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Text(
                                "${amount}",
                                fontSize = 11.sp,
                                maxLines = 1
                            )
                        }
                    }
                }

                // Balance display
                Text(
                    "Balance: ${KrCurrencyFormatter.formatKr(currentBalance)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Validation: minimum tip
                if (krInt in 1 until minTipKr.toInt()) {
                    Text(
                        "Minimum tip is ${KrCurrencyFormatter.formatKr(minTipKr)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                // Validation: insufficient balance
                if (krInt > currentBalance.toInt()) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "Insufficient balance",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedButton(onClick = onInsufficientBalance, modifier = Modifier.height(36.dp)) {
                            Text("Top Up / Recharge Wallet")
                        }
                    }
                }

                // Send button
                Button(
                    onClick = {
                        when {
                            krInt < minTipKr.toInt() -> {}
                            krInt > currentBalance.toInt() -> onInsufficientBalance()
                            else -> onConfirm(krAmount)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    enabled = krInt >= minTipKr.toInt() && krInt <= currentBalance.toInt()
                ) {
                    Text("Send Kr. $krInt Tip", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
