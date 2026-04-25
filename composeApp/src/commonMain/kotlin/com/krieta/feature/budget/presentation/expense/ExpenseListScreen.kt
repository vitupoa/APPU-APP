package com.krieta.feature.budget.presentation.expense

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
import com.krieta.feature.budget.domain.BudgetCategory
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

data class ExpenseListScreen(val budgetId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var expenses by remember { mutableStateOf<List<Expense>>(emptyList()) }
        var searchQuery by remember { mutableStateOf("") }
        var selectedCategory by remember { mutableStateOf<String?>(null) }
        var showFilterSheet by remember { mutableStateOf(false) }
        var isLoading by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Expenses") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    actions = {
                        IconButton(onClick = { showFilterSheet = true }) {
                            Icon(Icons.Default.FilterList, "Filter")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // Search bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    placeholder = { Text("Search expenses...") },
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, "Clear")
                            }
                        }
                    },
                    singleLine = true
                )

                // Total summary
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Total Expenses", fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
                            Text(
                                "${expenses.size} items",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Total Spent", fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
                            Text(
                                "KES ${expenses.sumOf { it.amount }}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = KrietaColors.Primary
                            )
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                if (isLoading) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(expenses.filter {
                            it.description.contains(searchQuery, ignoreCase = true) ||
                            it.merchant?.contains(searchQuery, ignoreCase = true) == true
                        }) { expense ->
                            ExpenseCard(
                                expense = expense,
                                onEdit = { /* TODO: Navigate to edit */ },
                                onDelete = { /* TODO: Delete expense */ }
                            )
                        }

                        if (expenses.isEmpty()) {
                            item {
                                EmptyExpenseState()
                            }
                        }
                    }
                }
            }
        }

        if (showFilterSheet) {
            FilterBottomSheet(
                onDismiss = { showFilterSheet = false },
                onApplyFilter = { category, startDate, endDate ->
                    selectedCategory = category
                    showFilterSheet = false
                    // TODO: Apply filters
                }
            )
        }
    }
}

@Composable
private fun ExpenseCard(
    expense: Expense,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
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
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        expense.description,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                    if (expense.merchant != null) {
                        Text(
                            expense.merchant,
                            fontSize = 12.sp,
                            color = KrietaColors.OnSurfaceVariant
                        )
                    }
                    Text(
                        formatDate(expense.expenseDate),
                        fontSize = 12.sp,
                        color = KrietaColors.OnSurfaceVariant
                    )
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

            if (expense.receiptUrl != null) {
                Row(
                    modifier = Modifier.padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Receipt,
                        null,
                        modifier = Modifier.size(16.dp),
                        tint = KrietaColors.OnSurfaceVariant
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "Receipt attached",
                        fontSize = 12.sp,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }
            }

            if (expense.isRecurring) {
                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Repeat,
                        null,
                        modifier = Modifier.size(16.dp),
                        tint = KrietaColors.Primary
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        expense.recurrence.name,
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterBottomSheet(
    onDismiss: () -> Unit,
    onApplyFilter: (category: String?, startDate: Long?, endDate: Long?) -> Unit
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text("Filter Expenses", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(16.dp))
            
            Text("Category", style = MaterialTheme.typography.titleMedium)
            // TODO: Add category selector
            
            Spacer(Modifier.height(16.dp))
            
            Text("Date Range", style = MaterialTheme.typography.titleMedium)
            // TODO: Add date range picker
            
            Spacer(Modifier.height(24.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Cancel")
                }
                Button(
                    onClick = { onApplyFilter(null, null, null) },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Apply")
                }
            }
            
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun EmptyExpenseState() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("💸", fontSize = 48.sp)
            Spacer(Modifier.height(16.dp))
            Text("No expenses yet", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(
                "Add your first expense to start tracking",
                fontSize = 14.sp,
                color = KrietaColors.OnSurfaceVariant
            )
        }
    }
}

private fun formatDate(timestamp: Long): String {
    val instant = Instant.fromEpochMilliseconds(timestamp)
    val dateTime = instant.toLocalDateTime(TimeZone.currentSystemDefault())
    return "${dateTime.dayOfMonth}/${dateTime.monthNumber}/${dateTime.year}"
}
