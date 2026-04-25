package com.krieta.feature.budget.presentation.list

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
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
import com.krieta.feature.budget.domain.Budget
import com.krieta.feature.budget.domain.BudgetStatus
import com.krieta.feature.budget.presentation.create.CreateBudgetScreen
import com.krieta.feature.budget.presentation.detail.BudgetDetailScreen

class BudgetListScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var budgets by remember { mutableStateOf<List<Budget>>(emptyList()) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("My Budgets") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { navigator.push(CreateBudgetScreen()) },
                    containerColor = KrietaColors.Primary
                ) {
                    Icon(Icons.Default.Add, "Create Budget")
                }
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Text(
                        "Track your spending",
                        fontSize = 14.sp,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }

                items(budgets) { budget ->
                    BudgetCard(
                        budget = budget,
                        onClick = { navigator.push(BudgetDetailScreen(budget.id)) }
                    )
                }

                if (budgets.isEmpty()) {
                    item {
                        EmptyState()
                    }
                }
            }
        }
    }
}

@Composable
private fun BudgetCard(budget: Budget, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.BackgroundElevated
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        budget.name,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "${budget.currency} ${budget.totalAmount}",
                        fontSize = 14.sp,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }
                StatusChip(budget.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Progress bar (placeholder)
            LinearProgressIndicator(
                progress = 0.65f,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp),
                color = when (budget.status) {
                    BudgetStatus.EXCEEDED -> KrietaColors.Error
                    BudgetStatus.ACTIVE -> KrietaColors.Primary
                    else -> KrietaColors.OnSurfaceVariant
                },
                trackColor = KrietaColors.OnSurfaceVariant.copy(alpha = 0.2f)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                "65% spent • ${budget.expenseCount} expenses",
                fontSize = 12.sp,
                color = KrietaColors.OnSurfaceVariant
            )
        }
    }
}

@Composable
private fun StatusChip(status: BudgetStatus) {
    val (text, color) = when (status) {
        BudgetStatus.ACTIVE -> "Active" to KrietaColors.Success
        BudgetStatus.EXCEEDED -> "Exceeded" to KrietaColors.Error
        BudgetStatus.PAUSED -> "Paused" to KrietaColors.OnSurfaceVariant
        BudgetStatus.COMPLETED -> "Completed" to KrietaColors.Primary
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            fontSize = 12.sp,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun EmptyState() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("💰", fontSize = 48.sp)
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "No budgets yet",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Create your first budget to start tracking",
                fontSize = 14.sp,
                color = KrietaColors.OnSurfaceVariant
            )
        }
    }
}
