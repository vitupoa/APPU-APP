package com.krieta.feature.analytics.presentation.screen

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.analytics.domain.model.AnalyticsTotals
import com.krieta.feature.analytics.domain.model.EarningsBreakdownItem
import com.krieta.feature.analytics.presentation.viewmodel.AnalyticsState
import com.krieta.feature.analytics.presentation.viewmodel.AnalyticsViewModel
import kotlinx.coroutines.flow.StateFlow

class AnalyticsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<AnalyticsViewModel>()
        val state: AnalyticsState by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Analytics") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
                )
            }
        ) { padding ->
            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(state.error!!, color = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.height(8.dp))
                        TextButton(onClick = { viewModel.refresh() }) { Text("Retry") }
                    }
                }
                state.analytics != null -> {
                    val analytics = state.analytics!!
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Period selector
                        PeriodSelector(
                            selected = state.selectedDays,
                            onSelect = { viewModel.selectPeriod(it) }
                        )

                        // Stats overview cards
                        StatsOverview(analytics.totals)

                        // Followers
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Followers", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Spacer(Modifier.height(12.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${analytics.followers.admirers}", fontWeight = FontWeight.Bold, fontSize = 22.sp)
                                        Text("Admirers", style = MaterialTheme.typography.labelSmall)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${analytics.followers.admiring}", fontWeight = FontWeight.Bold, fontSize = 22.sp)
                                        Text("Admiring", style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                            }
                        }

                        // Earnings breakdown
                        if (analytics.earningsBreakdown.isNotEmpty()) {
                            EarningsBreakdown(analytics.earningsBreakdown)
                        }

                        // Total earnings/spending summary
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Net Earnings", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    KrCurrencyFormatter.formatKr(analytics.totals.krEarned - analytics.totals.krSpent),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 28.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Earned: ${KrCurrencyFormatter.formatKr(analytics.totals.krEarned)} · Spent: ${KrCurrencyFormatter.formatKr(analytics.totals.krSpent)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun PeriodSelector(selected: Int, onSelect: (Int) -> Unit) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(7 to "7D", 30 to "30D", 90 to "90D").forEach { (days, label) ->
                FilterChip(
                    selected = selected == days,
                    onClick = { onSelect(days) },
                    label = { Text(label) }
                )
            }
        }
    }

    @Composable
    private fun StatsOverview(totals: AnalyticsTotals) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            StatCard(
                modifier = Modifier.weight(1f),
                icon = { Icon(painterResource(Res.drawable.ic_visibility), null, modifier = Modifier.size(20.dp)) },
                value = "${totals.views}",
                label = "Views"
            )
            StatCard(
                modifier = Modifier.weight(1f),
                icon = { Icon(painterResource(Res.drawable.ic_favorite), null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.error) },
                value = "${totals.likes}",
                label = "Likes"
            )
            StatCard(
                modifier = Modifier.weight(1f),
                icon = { Icon(painterResource(Res.drawable.ic_person_add), null, modifier = Modifier.size(20.dp)) },
                value = "+${totals.newAdmirers}",
                label = "New Admirers"
            )
        }
    }

    @Composable
    private fun StatCard(
        modifier: Modifier = Modifier,
        icon: @Composable () -> Unit,
        value: String,
        label: String
    ) {
        Card(
            modifier = modifier,
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                icon()
                Spacer(Modifier.height(6.dp))
                Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }

    @Composable
    private fun EarningsBreakdown(items: List<EarningsBreakdownItem>) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Earnings Breakdown", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(Modifier.height(12.dp))
                items.sortedByDescending { it.totalKr }.forEach { item ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(item.displayLabel, fontWeight = FontWeight.Medium)
                            Text("${item.count} transactions", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Text(
                            KrCurrencyFormatter.formatKr(item.totalKr),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 2.dp))
                }
            }
        }
    }
}

