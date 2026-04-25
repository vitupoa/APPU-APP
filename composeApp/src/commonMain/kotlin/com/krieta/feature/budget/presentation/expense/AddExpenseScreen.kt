package com.krieta.feature.budget.presentation.expense

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.budget.domain.ExpenseRecurrence
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerMode
import io.github.vinceglb.filekit.core.PickerType

data class AddExpenseScreen(val budgetId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var amount by remember { mutableStateOf("") }
        var description by remember { mutableStateOf("") }
        var notes by remember { mutableStateOf("") }
        var merchant by remember { mutableStateOf("") }
        var location by remember { mutableStateOf("") }
        var isRecurring by remember { mutableStateOf(false) }
        var recurrence by remember { mutableStateOf(ExpenseRecurrence.NONE) }
        var receiptUrl by remember { mutableStateOf<String?>(null) }
        var showRecurrenceMenu by remember { mutableStateOf(false) }

        val filePicker = rememberFilePickerLauncher(
            type = PickerType.Image,
            mode = PickerMode.Single
        ) { file ->
            file?.let {
                // TODO: Upload to Cloudinary
                receiptUrl = "uploaded_url"
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Add Expense") },
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
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    leadingIcon = { Text("KES") },
                    singleLine = true
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = merchant,
                    onValueChange = { merchant = it },
                    label = { Text("Merchant (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = { Text("Location (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5
                )

                OutlinedButton(
                    onClick = { filePicker.launch() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.CameraAlt, null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (receiptUrl != null) "Receipt Uploaded" else "Upload Receipt")
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Recurring Expense")
                    Switch(
                        checked = isRecurring,
                        onCheckedChange = { isRecurring = it }
                    )
                }

                if (isRecurring) {
                    ExposedDropdownMenuBox(
                        expanded = showRecurrenceMenu,
                        onExpandedChange = { showRecurrenceMenu = it }
                    ) {
                        OutlinedTextField(
                            value = recurrence.name,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Frequency") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(showRecurrenceMenu) },
                            modifier = Modifier.fillMaxWidth().menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = showRecurrenceMenu,
                            onDismissRequest = { showRecurrenceMenu = false }
                        ) {
                            ExpenseRecurrence.entries.filter { it != ExpenseRecurrence.NONE }.forEach { r ->
                                DropdownMenuItem(
                                    text = { Text(r.name) },
                                    onClick = {
                                        recurrence = r
                                        showRecurrenceMenu = false
                                    }
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.weight(1f))

                Button(
                    onClick = { /* TODO: Save expense */ },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = amount.isNotBlank() && description.isNotBlank()
                ) {
                    Text("Add Expense")
                }
            }
        }
    }
}
