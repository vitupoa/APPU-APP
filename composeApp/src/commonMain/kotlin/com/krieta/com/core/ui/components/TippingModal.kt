package com.krieta.com.core.ui.components

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material.icons.filled.Close
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
    val exchangeRate by currencyProvider.exchangeRate.collectAsState()
    val minTipKr = 50.0

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
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

                KrAmountInput(
                    currencyCode = currencyProvider.currencyCode,
                    exchangeRate = exchangeRate?.baseRate ?: 1.0,
                    onAmountChanged = { fiat, kr ->
                        fiatAmount = fiat
                        krAmount = kr
                    },
                    label = "Tip Amount"
                )

                // Quick tip buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(500.0, 1000.0, 2000.0, 5000.0).forEach { amount ->
                        OutlinedButton(
                            onClick = {
                                krAmount = amount
                                fiatAmount = currencyProvider.krToFiat(amount)
                            },
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("${amount.toInt()}", fontSize = 12.sp)
                        }
                    }
                }

                Text(
                    "Balance: ${KrCurrencyFormatter.formatKr(currentBalance)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (krAmount > 0 && krAmount < minTipKr) {
                    Text(
                        "Minimum tip is Kr.$minTipKr",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                if (krAmount > currentBalance) {
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

                Button(
                    onClick = {
                        when {
                            krAmount < minTipKr -> {}
                            krAmount > currentBalance -> onInsufficientBalance()
                            else -> onConfirm(krAmount)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    enabled = krAmount >= minTipKr && krAmount <= currentBalance
                ) {
                    Text("Send Tip", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
