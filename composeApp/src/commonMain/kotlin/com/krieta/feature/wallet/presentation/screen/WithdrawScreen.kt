package com.krieta.feature.wallet.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.wallet.presentation.viewmodel.WithdrawProvider
import com.krieta.feature.wallet.presentation.viewmodel.WithdrawViewModel
import androidx.compose.foundation.BorderStroke

class WithdrawScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<WithdrawViewModel>()
        val state by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Withdraw") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(padding)
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(16.dp))

                // Available Balance
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Available Balance", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            KrCurrencyFormatter.formatKr(state.krBalance),
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Provider Selection
                Text(
                    "Withdraw To",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.align(Alignment.Start)
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    WithdrawProvider.entries.forEach { provider ->
                        OutlinedCard(
                            onClick = { viewModel.selectProvider(provider) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(
                                width = if (state.selectedProvider == provider) 2.dp else 1.dp,
                                color = if (state.selectedProvider == provider) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.outlineVariant
                            ),
                            colors = CardDefaults.outlinedCardColors(
                                containerColor = if (state.selectedProvider == provider) MaterialTheme.colorScheme.primaryContainer
                                else MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 14.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = provider.displayName,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = if (state.selectedProvider == provider) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Destination Account
                OutlinedTextField(
                    value = state.destinationAccount,
                    onValueChange = { viewModel.onDestinationChanged(it) },
                    modifier = Modifier.fillMaxWidth(),
                    label = {
                        Text(
                            if (state.selectedProvider == WithdrawProvider.MPESA) "M-Pesa Phone Number"
                            else "Payoneer Email"
                        )
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = if (state.selectedProvider == WithdrawProvider.MPESA) KeyboardType.Phone
                        else KeyboardType.Email
                    ),
                    singleLine = true,
                    enabled = !state.isProcessing
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Fiat Amount
                OutlinedTextField(
                    value = state.fiatInput,
                    onValueChange = { viewModel.onFiatAmountChanged(it) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("0.00") },
                    label = { Text("Amount to Withdraw") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    enabled = !state.isProcessing && !state.isLoadingRate,
                    prefix = {
                        Text(
                            text = "${state.exchangeRate?.currency ?: ""} ",
                            fontWeight = FontWeight.Bold
                        )
                    }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Kr Cost Preview
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "Will deduct from wallet",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                        )
                        Spacer(modifier = Modifier.height(4.dp))

                        if (state.isLoadingRate) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        } else {
                            Text(
                                text = KrCurrencyFormatter.formatKr(state.krCost),
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (viewModel.hasSufficientBalance()) MaterialTheme.colorScheme.onSecondaryContainer
                                else MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }

                // Insufficient balance warning
                if (state.krCost > 0 && !viewModel.hasSufficientBalance()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(painterResource(Res.drawable.ic_warning),
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            "Insufficient Kr balance",
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Error
                if (state.error != null) {
                    Text(state.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    Spacer(modifier = Modifier.height(8.dp))
                }

                // Confirm Button
                Button(
                    onClick = { /* Initiate withdrawal */ },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    enabled = viewModel.hasSufficientBalance()
                            && state.destinationAccount.isNotBlank()
                            && !state.isProcessing
                            && !state.isLoadingRate,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (state.isProcessing) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                    } else {
                        Text(
                            "Withdraw to ${state.selectedProvider.displayName}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}


