package com.krieta.feature.budget.presentation.analytics

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.budget.domain.*
import io.github.koalaplot.core.pie.DefaultSlice
import io.github.koalaplot.core.pie.PieChart
import io.github.koalaplot.core.util.ExperimentalKoalaPlotApi

data class BudgetAnalyticsScreen(val budgetId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class, ExperimentalKoalaPlotApi::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var isLoading by remember { mutableStateOf(false) }
        
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
                    CategoryBreakdown("3", "Entertainment", 5000.0, 3000.0, 2000.0, 60.0),
                    CategoryBreakdown("4", "Shopping", 8000.0, 5000.0, 3000.0, 62.5),
                    CategoryBreakdown("5", "Bills", 12000.0, 4000.0, 8000.0, 33.3)
                ),
                dailySpending = listOf(
                    DailySpending("2024-12-01", 450.0),
                    DailySpending("2024-12-02", 680.0),
                    DailySpending("2024-12-03", 320.0),
                    DailySpending("2024-12-04", 890.0),
                    DailySpending("2024-12-05", 540.0),
                    DailySpending("2024-12-06", 720.0),
                    DailySpending("2024-12-07", 610.0)
                ),
                alertThreshold = 80,
                shouldAlert = false
            )
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Budget Analytics") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    actions = {
                        IconButton(onClick = { /* TODO: Export */ }) {
                            Icon(Icons.Default.Share, "Export")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            }
        ) { padding ->
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item { OverviewCards(analytics) }
                    item { Text("Category Breakdown", style = MaterialTheme.typography.titleMedium) }
                    item { CategoryPieChart(analytics.categoryBreakdown) }
                    item { Text("Spending by Category", style = MaterialTheme.typography.titleMedium) }
                    items(analytics.categoryBreakdown.sortedByDescending { it.spent }) { category ->
                        CategorySpendingCard(category)
                    }
                    item { Text("Daily Spending Trend", style = MaterialTheme.typography.titleMedium) }
                    item { DailySpendingChart(analytics.dailySpending) }
                    if (analytics.shouldAlert) {
                        item { AlertCard(analytics) }
                    }
                }
            }
        }
    }
}

@Composable
private fun OverviewCards(analytics: BudgetAnalytics) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        OverviewCard("Total Budget", "KES ${analytics.totalBudget}", Icons.Default.AccountBalance, KrietaColors.Primary, Modifier.weight(1f))
        OverviewCard("Spent", "KES ${analytics.totalSpent}", Icons.Default.TrendingUp, MaterialTheme.colorScheme.tertiary, Modifier.weight(1f))
    }
    Spacer(Modifier.height(8.dp))
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        OverviewCard("Remaining", "KES ${analytics.remaining}", Icons.Default.Savings, KrietaColors.Success, Modifier.weight(1f))
        OverviewCard("Progress", "${analytics.percentageSpent.toInt()}%", Icons.Default.PieChart, if (analytics.percentageSpent >= 80) KrietaColors.Error else KrietaColors.Primary, Modifier.weight(1f))
    }
}

@Composable
private fun OverviewCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))) {
        Column(modifier = Modifier.padding(12.dp)) {
            Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
            Spacer(Modifier.height(8.dp))
            Text(title, fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@OptIn(ExperimentalKoalaPlotApi::class)
@Composable
private fun CategoryPieChart(categories: List<CategoryBreakdown>) {
    Card(modifier = Modifier.fillMaxWidth().height(250.dp), colors = CardDefaults.cardColors(containerColor = KrietaColors.BackgroundElevated)) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            val colors = listOf(Color(0xFF4CAF50), Color(0xFF2196F3), Color(0xFFFFC107), Color(0xFFE91E63), Color(0xFF9C27B0))
            PieChart(
                values = categories.map { it.spent.toFloat() },
                slice = { index -> DefaultSlice(color = colors[index % colors.size], hoverExpandFactor = 1.1f) },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
private fun CategorySpendingCard(category: CategoryBreakdown) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = KrietaColors.BackgroundElevated)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(category.name, fontWeight = FontWeight.Medium)
                    Text("KES ${category.spent} of ${category.allocated}", fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
                }
                Text("${category.percentage.toInt()}%", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = when {
                    category.percentage >= 100 -> KrietaColors.Error
                    category.percentage >= 80 -> MaterialTheme.colorScheme.tertiary
                    else -> KrietaColors.Success
                })
            }
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = (category.percentage / 100).toFloat().coerceIn(0f, 1f),
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = when {
                    category.percentage >= 100 -> KrietaColors.Error
                    category.percentage >= 80 -> MaterialTheme.colorScheme.tertiary
                    else -> KrietaColors.Primary
                }
            )
        }
    }
}

@Composable
private fun DailySpendingChart(dailySpending: List<DailySpending>) {
    Card(modifier = Modifier.fillMaxWidth().height(200.dp), colors = CardDefaults.cardColors(containerColor = KrietaColors.BackgroundElevated)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Last 7 Days", fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
            Spacer(Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                val maxSpending = dailySpending.maxOfOrNull { it.total } ?: 1.0
                dailySpending.forEach { day ->
                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(modifier = Modifier.width(24.dp).height(((day.total / maxSpending) * 100).dp)) {
                            Surface(modifier = Modifier.fillMaxSize(), color = KrietaColors.Primary, shape = MaterialTheme.shapes.small) {}
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(day.date.takeLast(2), fontSize = 10.sp, color = KrietaColors.OnSurfaceVariant)
                    }
                }
            }
        }
    }
}

@Composable
private fun AlertCard(analytics: BudgetAnalytics) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(32.dp))
            Spacer(Modifier.width(12.dp))
            Column {
                Text("Budget Alert", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onErrorContainer)
                Text("You've spent ${analytics.percentageSpent.toInt()}% of your budget", fontSize = 14.sp, color = MaterialTheme.colorScheme.onErrorContainer)
            }
        }
    }
}
