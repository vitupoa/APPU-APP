package com.krieta.feature.wallet.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.GlassmorphicContainer
import com.krieta.com.core.theme.bounceClick
import com.krieta.com.core.theme.KrietaColors
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.wallet.domain.model.Transaction
import com.krieta.feature.wallet.domain.model.TransactionType
import com.krieta.feature.wallet.presentation.viewmodel.WalletState
import com.krieta.feature.wallet.presentation.viewmodel.WalletViewModel

class WalletScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<WalletViewModel>()
        val state by viewModel.state.collectAsState()
        
        var isBalanceHidden by remember { mutableStateOf(false) }
        
        val currentRegion = androidx.compose.ui.text.intl.Locale.current.region
        LaunchedEffect(currentRegion) {
            viewModel.fetchWalletData(currentRegion)
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
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Failed to load wallet", color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(onClick = { viewModel.fetchWalletData() }) {
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
                                            colors = listOf(KrietaColors.PrimaryDark, KrietaColors.Background)
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
                                                Icon(
                                                    imageVector = if (isBalanceHidden) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                    contentDescription = "Toggle Balance",
                                                    tint = Color.White.copy(alpha = 0.6f)
                                                )
                                            }
                                        }
                                        
                                        Spacer(modifier = Modifier.height(12.dp))
                                        
                                        // Golden Kr Amount mapped elegantly
                                        Text(
                                            text = if (isBalanceHidden) "Kr ****" else KrCurrencyFormatter.formatKr(currentState.balance.krBalance),
                                            style = MaterialTheme.typography.displayMedium,
                                            color = KrietaColors.KrGold
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        
                                        // Subtle Fiat mapping seamlessly aligned
                                        Text(
                                            text = if (isBalanceHidden) "~ $**.**" else "~ " + KrCurrencyFormatter.formatFiat(
                                                currentState.balance.fiatEquivalent,
                                                currentState.balance.currency
                                            ),
                                            style = MaterialTheme.typography.bodyLarge,
                                            color = Color.White.copy(alpha = 0.6f)
                                        )

                                        Spacer(modifier = Modifier.height(32.dp))
                                        
                                        // Action Buttons - Organic Bounce Click enabled!
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceEvenly
                                        ) {
                                            WalletActionButton(
                                                icon = Icons.Default.Add, 
                                                label = "Top Up", 
                                                onClick = { navigator.push(TopupScreen()) }
                                            )
                                            WalletActionButton(
                                                icon = Icons.Default.ArrowDownward, 
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
                                        TransactionItem(tx)
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
        icon: androidx.compose.ui.graphics.vector.ImageVector,
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
                 Icon(imageVector = icon, contentDescription = label, tint = Color.White)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, style = MaterialTheme.typography.labelMedium, color = Color.White.copy(alpha = 0.8f))
        }
    }

    @Composable
    private fun TransactionItem(transaction: Transaction) {
        val isPositive = when (transaction.type) {
            TransactionType.TOPUP, TransactionType.TIP_RECEIVED, TransactionType.CONTEST_PRIZE, TransactionType.SUBSCRIPTION_EARNED -> true
            else -> false
        }
        
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
                    imageVector = if (isPositive) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
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
                    text = transaction.createdAt.take(10), // Simplistic date format, adapt with DateTimeUtil
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Text(
                text = (if (isPositive) "+" else "-") + KrCurrencyFormatter.formatKr(transaction.amountKr),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (isPositive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
            )
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    }
}

