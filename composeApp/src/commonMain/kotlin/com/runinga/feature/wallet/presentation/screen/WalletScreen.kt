package com.runinga.feature.wallet.presentation.screen

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.runinga.com.core.location.LocationProvider
import com.runinga.com.core.location.UserCurrencyProvider
import com.runinga.com.core.theme.GlassmorphicContainer
import com.runinga.com.core.theme.bounceClick
import com.runinga.com.core.theme.RuningaColors
import com.runinga.com.core.util.KrCurrencyFormatter
import com.runinga.feature.wallet.domain.model.Transaction
import com.runinga.feature.wallet.domain.model.TransactionType
import com.runinga.feature.wallet.presentation.viewmodel.WalletState
import com.runinga.feature.wallet.presentation.viewmodel.WalletViewModel
import org.koin.compose.koinInject

class WalletScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<WalletViewModel>()
        val state by viewModel.state.collectAsState()
        val locationProvider = koinInject<LocationProvider>()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val exchangeRate by currencyProvider.exchangeRate.collectAsState()
        
        var isBalanceHidden by remember { mutableStateOf(false) }
        
        val countryCode = remember { locationProvider.getCurrentCountry() }
        LaunchedEffect(countryCode) {
            currencyProvider.start()
            kotlinx.coroutines.delay(500)
            if (countryCode.isNotEmpty()) {
                viewModel.fetchWalletData(countryCode)
            } else {
                println("⚠️ Country code is empty, using default")
                viewModel.fetchWalletData("US") // Fallback to US
            }
        }
        
        LaunchedEffect(exchangeRate) {
            if (exchangeRate != null) {
                kotlinx.coroutines.delay(500)
                viewModel.fetchWalletData(countryCode)
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Wallet") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background
                    )
                )
            }
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                when (val currentState = state) {
                    is WalletState.Loading -> {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    }
                    is WalletState.Error -> {
                        Column(
                            modifier = Modifier.align(Alignment.Center).padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                "Failed to load wallet", 
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                currentState.message,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodyMedium,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { 
                                val retryCountry = locationProvider.getCurrentCountry()
                                viewModel.fetchWalletData(if (retryCountry.isEmpty()) "US" else retryCountry)
                            }) {
                                Text("Retry")
                            }
                        }
                    }
                    is WalletState.Success -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            // Luxurious Glassmorphic Balance Wrapper
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                                    .background(
                                        brush = Brush.linearGradient(
                                            colors = listOf(RuningaColors.PrimaryDark, RuningaColors.Background)
                                        ),
                                        shape = RoundedCornerShape(32.dp)
                                    )
                            ) {
                                GlassmorphicContainer(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(32.dp),
                                    alpha = 0.2f
                                ) {
                                    Column(
                                        modifier = Modifier.padding(32.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                "Total Balance", 
                                                style = MaterialTheme.typography.titleMedium,
                                                color = Color.White.copy(alpha = 0.8f)
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            IconButton(
                                                onClick = { isBalanceHidden = !isBalanceHidden },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(painter = if (isBalanceHidden) painterResource(Res.drawable.ic_visibility_off) else painterResource(Res.drawable.ic_visibility),
                                                    contentDescription = "Toggle Balance",
                                                    tint = Color.White.copy(alpha = 0.6f)
                                                )
                                            }
                                        }
                                        
                                        Spacer(modifier = Modifier.height(12.dp))
                                        
                                        // Golden Rc Amount
                                        Text(
                                            text = if (isBalanceHidden) "Rc ****" else RcCurrencyFormatter.formatKr(currentState.balance.krBalance),
                                            style = MaterialTheme.typography.displayMedium,
                                            color = RuningaColors.KrGold
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        
                                        // Real-time fiat equivalent based on detected location
                                        Text(
                                            text = if (isBalanceHidden) "~ $**.**" else "~ " + RcCurrencyFormatter.formatFiat(
                                                currentState.balance.fiatEquivalent,
                                                currentState.balance.currency
                                            ),
                                            style = MaterialTheme.typography.bodyLarge,
                                            color = Color.White.copy(alpha = 0.6f)
                                        )

                                        Spacer(modifier = Modifier.height(32.dp))
                                        
                                        // Action Buttons
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceEvenly
                                        ) {
                                            WalletActionButton(
                                                icon = painterResource(Res.drawable.ic_add), 
                                                label = "Top Up", 
                                                onClick = { navigator.push(TopupScreen()) }
                                            )
                                            WalletActionButton(
                                                icon = painterResource(Res.drawable.ic_arrow_downward), 
                                                label = "Withdraw", 
                                                onClick = { navigator.push(WithdrawScreen()) }
                                            )
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Text(
                                text = "Recent Transactions",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            if (currentState.recentTransactions.isEmpty()) {
                                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                                    Text("No transactions yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            } else {
                                LazyColumn(
                                    modifier = Modifier.fillMaxWidth().weight(1f),
                                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                                ) {
                                    items(currentState.recentTransactions) { tx ->
                                        TransactionItem(tx, currencyProvider)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun WalletActionButton(
        icon: androidx.compose.ui.graphics.painter.Painter,
        label: String,
        onClick: () -> Unit
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .bounceClick { onClick() }
                    .background(
                        color = Color.White.copy(alpha = 0.1f), 
                        shape = RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                 Icon(painter = icon, contentDescription = label, tint = Color.White)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, style = MaterialTheme.typography.labelMedium, color = Color.White.copy(alpha = 0.8f))
        }
    }

    @Composable
    private fun TransactionItem(transaction: Transaction, currencyProvider: UserCurrencyProvider) {
        val isPositive = when (transaction.type) {
            TransactionType.TOPUP, TransactionType.TIP_RECEIVED, TransactionType.CONTEST_PRIZE, TransactionType.SUBSCRIPTION_EARNED -> true
            else -> false
        }
        
        // Calculate fiat equivalent for this transaction
        val fiatAmount = currencyProvider.krToFiat(transaction.amountKr)
        val currencyCode = currencyProvider.currencyCode
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(
                        color = if (isPositive) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer,
                        shape = RoundedCornerShape(8.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = if (isPositive) painterResource(Res.drawable.ic_arrow_downward) else painterResource(Res.drawable.ic_arrow_upward),
                    contentDescription = null,
                    tint = if (isPositive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = transaction.type.name.replace("_", " "),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = transaction.createdAt.take(10),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = (if (isPositive) "+" else "-") + RcCurrencyFormatter.formatKr(transaction.amountKr),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isPositive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                )
                if (fiatAmount > 0) {
                    Text(
                        text = "~${KrCurrencyFormatter.formatFiat(fiatAmount, currencyCode)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    }
}

