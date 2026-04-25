package com.krieta.feature.budget.presentation.detail

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.budget.domain.*
import com.krieta.feature.budget.presentation.expense.AddExpenseScreen
import io.github.koalaplot.core.pie.PieChart
import io.github.koalaplot.core.util.ExperimentalKoalaPlotApi

data class BudgetDetailScreen(val budgetId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class, ExperimentalKoalaPlotApi::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        // Mock data - replace with actual API call
        val budget = remember {
            Budget(
                id = budgetId,
                userId = "user1",
                name = "Monthly Budget",
                description = "December 2024",
                totalAmount = 50000.0,
                currency = "KES",
                period = BudgetPeriod.MONTHLY,
                startDate = System.currentTimeMillis(),
                endDate = System.currentTimeMillis() + 30L * 24 * 60 * 60 * 1000,
                status = BudgetStatus.ACTIVE,
                alertAt = 80,
                expenseCount = 15
            )
        }
        
        val analytics = remember {
            BudgetAnalytics(
                totalBudget = 50000.0,
                totalSpent = 32500.0,
                remaining = 17500.0,
                percentageSpent = 65.0,
                status = BudgetStatus.ACTIVE,
                categoryBreakdown = listOf(
                    CategoryBreakdown("1", "Food", 15000.0, 12000.0, 3000.0, 80.0),
                    CategoryBreakdown("2", "Transport", 10000.0, 8500.0, 1500.0, 85.0),
                    CategoryBreakdown("3", "Entertainment", 5000.0, 3000.0, 2000.0, 60.0)
                ),
                dailySpending = emptyList(),
                alertThreshold = 80,
                shouldAlert = false
            )
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(budget.name) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    actions = {
                        IconButton(onClick = { /* Edit */ }) {
                            Icon(Icons.Default.Edit, "Edit")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { navigator.push(AddExpenseScreen(budgetId)) },
                    containerColor = KrietaColors.Primary
                ) {
                    Icon(Icons.Default.Add, "Add Expense")
                }
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    OverviewCard(budget, analytics)
                }

                item {
                    Text("Category Breakdown", style = MaterialTheme.typography.titleMedium)
                }

                items(analytics.categoryBreakdown) { category ->
                    CategoryBreakdownCard(category)
                }

                item {
                    if (analytics.shouldAlert) {
                        AlertBanner(analytics)
                    }
                }
            }
        }
    }
}

@Composable
private fun OverviewCard(budget: Budget, analytics: BudgetAnalytics) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = KrietaColors.BackgroundElevated)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Budget", fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
                    Text(
                        "${budget.currency} ${budget.totalAmount}",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Remaining", fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
                    Text(
                        "${budget.currency} ${analytics.remaining}",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (analytics.remaining < 0) KrietaColors.Error else KrietaColors.Success
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            LinearProgressIndicator(
                progress = (analytics.percentageSpent / 100).toFloat(),
                modifier = Modifier.fillMaxWidth().height(12.dp),
                color = when {
                    analytics.percentageSpent >= 100 -> KrietaColors.Error
                    analytics.percentageSpent >= analytics.alertThreshold -> MaterialTheme.colorScheme.tertiary
                    else -> KrietaColors.Primary
                }
            )

            Spacer(Modifier.height(8.dp))

            Text(
                "${analytics.percentageSpent.toInt()}% spent • ${budget.expenseCount} expenses",
                fontSize = 12.sp,
                color = KrietaColors.OnSurfaceVariant
            )
        }
    }
}

@Composable
private fun CategoryBreakdownCard(category: CategoryBreakdown) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = KrietaColors.BackgroundElevated)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(category.name, fontWeight = FontWeight.Medium)
                Text(
                    "${category.spent} / ${category.allocated}",
                    fontSize = 12.sp,
                    color = KrietaColors.OnSurfaceVariant
                )
            }
            Text(
                "${category.percentage.toInt()}%",
                fontWeight = FontWeight.Bold,
                color = if (category.percentage >= 100) KrietaColors.Error else KrietaColors.Primary
            )
        }
    }
}

@Composable
private fun AlertBanner(analytics: BudgetAnalytics) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error)
            Spacer(Modifier.width(8.dp))
            Text(
                "You've reached ${analytics.percentageSpent.toInt()}% of your budget",
                color = MaterialTheme.colorScheme.onErrorContainer
            )
        }
    }
}
