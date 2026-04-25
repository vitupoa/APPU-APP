package com.krieta.feature.budget.presentation.create

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.budget.domain.BudgetPeriod

data class CategoryInput(
    val name: String = "",
    val amount: String = "",
    val icon: String = "💰",
    val color: String = "#4CAF50"
)

class CreateBudgetScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var name by remember { mutableStateOf("") }
        var totalAmount by remember { mutableStateOf("") }
        var period by remember { mutableStateOf(BudgetPeriod.MONTHLY) }
        var alertAt by remember { mutableStateOf(80f) }
        var categories by remember { mutableStateOf(listOf<CategoryInput>()) }
        var showPeriodMenu by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Create Budget") },
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
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Budget Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    OutlinedTextField(
                        value = totalAmount,
                        onValueChange = { totalAmount = it },
                        label = { Text("Total Amount") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        leadingIcon = { Text("KES") },
                        singleLine = true
                    )
                }

                item {
                    ExposedDropdownMenuBox(
                        expanded = showPeriodMenu,
                        onExpandedChange = { showPeriodMenu = it }
                    ) {
                        OutlinedTextField(
                            value = period.name,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Period") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(showPeriodMenu) },
                            modifier = Modifier.fillMaxWidth().menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = showPeriodMenu,
                            onDismissRequest = { showPeriodMenu = false }
                        ) {
                            BudgetPeriod.entries.forEach { p ->
                                DropdownMenuItem(
                                    text = { Text(p.name) },
                                    onClick = {
                                        period = p
                                        showPeriodMenu = false
                                    }
                                )
                            }
                        }
                    }
                }

                item {
                    Column {
                        Text("Alert at ${alertAt.toInt()}%")
                        Slider(
                            value = alertAt,
                            onValueChange = { alertAt = it },
                            valueRange = 50f..100f,
                            steps = 9
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Categories", style = MaterialTheme.typography.titleMedium)
                        TextButton(onClick = {
                            categories = categories + CategoryInput()
                        }) {
                            Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Add")
                        }
                    }
                }

                itemsIndexed(categories) { index, category ->
                    CategoryInputCard(
                        category = category,
                        onUpdate = { updated ->
                            categories = categories.toMutableList().apply { set(index, updated) }
                        },
                        onRemove = {
                            categories = categories.filterIndexed { i, _ -> i != index }
                        }
                    )
                }

                item {
                    Button(
                        onClick = { /* TODO: Save budget */ },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = name.isNotBlank() && totalAmount.isNotBlank()
                    ) {
                        Text("Create Budget")
                    }
                }
            }
        }
    }
}

@Composable
private fun CategoryInputCard(
    category: CategoryInput,
    onUpdate: (CategoryInput) -> Unit,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = KrietaColors.BackgroundElevated)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                OutlinedTextField(
                    value = category.name,
                    onValueChange = { onUpdate(category.copy(name = it)) },
                    label = { Text("Name") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                IconButton(onClick = onRemove) {
                    Icon(Icons.Default.Delete, "Remove")
                }
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = category.amount,
                onValueChange = { onUpdate(category.copy(amount = it)) },
                label = { Text("Allocated Amount") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                singleLine = true
            )
        }
    }
}
