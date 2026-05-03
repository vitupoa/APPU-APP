package com.krieta.feature.contentlock.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@Composable
fun ContentLockSettings(
    userCurrency: String,
    viewModel: ContentLockViewModel,
    onLockConfigured: (unlockAmountKr: Int?, requiresTier: String?) -> Unit
) {
    var isLocked by remember { mutableStateOf(false) }
    var fiatAmount by remember { mutableStateOf("") }
    var selectedTier by remember { mutableStateOf<String?>(null) }
    val convertedKr by viewModel.convertedKr.collectAsState()

    LaunchedEffect(fiatAmount) {
        val amount = fiatAmount.toDoubleOrNull()
        if (amount != null && amount > 0) {
            viewModel.convertFiatToKr(amount, userCurrency)
        }
    }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Lock Content", style = MaterialTheme.typography.titleMedium)
            Switch(checked = isLocked, onCheckedChange = { isLocked = it })
        }

        if (isLocked) {
            Spacer(modifier = Modifier.height(16.dp))

            Text("Access Method", style = MaterialTheme.typography.titleSmall)
            
            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = { selectedTier = if (selectedTier == null) "TOP_FUN" else null },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (selectedTier != null) "✓ Subscription Required" else "Require Subscription")
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text("OR", modifier = Modifier.align(Alignment.CenterHorizontally), color = Color.Gray)
            Spacer(modifier = Modifier.height(8.dp))

            Text("One-Time Unlock Price", style = MaterialTheme.typography.titleSmall)
            
            OutlinedTextField(
                value = fiatAmount,
                onValueChange = { fiatAmount = it },
                label = { Text("Amount in $userCurrency") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )

            if (convertedKr != null && convertedKr!! > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("$convertedKr Kr", style = MaterialTheme.typography.titleLarge)
                        Text("(≈ $fiatAmount $userCurrency)", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    onLockConfigured(
                        if (fiatAmount.isNotEmpty()) convertedKr else null,
                        selectedTier
                    )
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Apply Lock Settings")
            }
        }
    }
}
