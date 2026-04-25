package com.krieta.feature.budget.presentation.recurring

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
import com.krieta.feature.budget.domain.Expense
import com.krieta.feature.budget.domain.ExpenseRecurrence
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

class RecurringExpensesScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var recurringExpenses by remember { mutableStateOf<List<Expense>>(emptyList()) }
        var isLoading by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Recurring Expenses") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
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
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            "Manage your recurring expenses",
                            fontSize = 14.sp,
                            color = KrietaColors.OnSurfaceVariant
                        )
                    }

                    items(recurringExpenses) { expense ->
                        RecurringExpenseCard(
                            expense = expense,
                            onPause = { /* TODO: Pause */ },
                            onResume = { /* TODO: Resume */ },
                            onEdit = { /* TODO: Edit */ },
                            onDelete = { /* TODO: Delete */ }
                        )
                    }

                    if (recurringExpenses.isEmpty()) {
                        item {
                            EmptyRecurringState()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RecurringExpenseCard(
    expense: Expense,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    var isPaused by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isPaused) 
                KrietaColors.OnSurfaceVariant.copy(alpha = 0.1f) 
            else 
                KrietaColors.BackgroundElevated
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            expense.description,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium
                        )
                        if (isPaused) {
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                shape = MaterialTheme.shapes.small,
                                color = KrietaColors.OnSurfaceVariant.copy(alpha = 0.2f)
                            ) {
                                Text(
                                    "PAUSED",
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    fontSize = 10.sp,
                                    color = KrietaColors.OnSurfaceVariant
                                )
                            }
                        }
                    }
                    
                    if (expense.merchant != null) {
                        Text(
                            expense.merchant,
                            fontSize = 12.sp,
                            color = KrietaColors.OnSurfaceVariant
                        )
                    }
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        "${expense.currency} ${expense.amount}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.Primary
                    )
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, "More")
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                FrequencyChip(expense.recurrence)
                
                if (expense.nextDueDate != null) {
                    NextDueChip(expense.nextDueDate)
                }
            }

            if (expense.category != null) {
                Spacer(Modifier.height(8.dp))
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = KrietaColors.Primary.copy(alpha = 0.1f)
                ) {
                    Text(
                        expense.category.name,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        fontSize = 12.sp,
                        color = KrietaColors.Primary
                    )
                }
            }
        }

        DropdownMenu(
            expanded = showMenu,
            onDismissRequest = { showMenu = false }
        ) {
            if (isPaused) {
                DropdownMenuItem(
                    text = { Text("Resume") },
                    onClick = {
                        showMenu = false
                        isPaused = false
                        onResume()
                    },
                    leadingIcon = { Icon(Icons.Default.PlayArrow, null) }
                )
            } else {
                DropdownMenuItem(
                    text = { Text("Pause") },
                    onClick = {
                        showMenu = false
                        isPaused = true
                        onPause()
                    },
                    leadingIcon = { Icon(Icons.Default.Pause, null) }
                )
            }
            DropdownMenuItem(
                text = { Text("Edit") },
                onClick = {
                    showMenu = false
                    onEdit()
                },
                leadingIcon = { Icon(Icons.Default.Edit, null) }
            )
            DropdownMenuItem(
                text = { Text("Delete") },
                onClick = {
                    showMenu = false
                    onDelete()
                },
                leadingIcon = { Icon(Icons.Default.Delete, null) }
            )
        }
    }
}

@Composable
private fun FrequencyChip(recurrence: ExpenseRecurrence) {
    val (icon, text, color) = when (recurrence) {
        ExpenseRecurrence.DAILY -> Triple(Icons.Default.Today, "Daily", Color(0xFF4CAF50))
        ExpenseRecurrence.WEEKLY -> Triple(Icons.Default.CalendarToday, "Weekly", Color(0xFF2196F3))
        ExpenseRecurrence.MONTHLY -> Triple(Icons.Default.CalendarMonth, "Monthly", Color(0xFFFFC107))
        ExpenseRecurrence.YEARLY -> Triple(Icons.Default.Event, "Yearly", Color(0xFFE91E63))
        else -> Triple(Icons.Default.Repeat, "None", KrietaColors.OnSurfaceVariant)
    }

    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon,
                null,
                modifier = Modifier.size(14.dp),
                tint = color
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text,
                fontSize = 12.sp,
                color = color,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun NextDueChip(nextDueDate: Long) {
    val daysUntil = ((nextDueDate - System.currentTimeMillis()) / (1000 * 60 * 60 * 24)).toInt()
    val isOverdue = daysUntil < 0
    val color = if (isOverdue) KrietaColors.Error else KrietaColors.Success

    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                if (isOverdue) Icons.Default.Warning else Icons.Default.Schedule,
                null,
                modifier = Modifier.size(14.dp),
                tint = color
            )
            Spacer(Modifier.width(4.dp))
            Text(
                if (isOverdue) "Overdue" else "Due in $daysUntil days",
                fontSize = 12.sp,
                color = color,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun EmptyRecurringState() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("🔄", fontSize = 48.sp)
            Spacer(Modifier.height(16.dp))
            Text(
                "No recurring expenses",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Set up recurring expenses to automate tracking",
                fontSize = 14.sp,
                color = KrietaColors.OnSurfaceVariant
            )
        }
    }
}
