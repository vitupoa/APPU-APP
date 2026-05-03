package com.krieta.feature.contests.presentation.screen.wizard

import com.krieta.com.core.util.SafeConversion
import com.krieta.com.core.util.formatString

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krieta.feature.contests.presentation.viewmodel.CreateContestState
import com.krieta.feature.contests.presentation.viewmodel.CreateContestViewModel
import com.krieta.feature.contests.presentation.viewmodel.SelectionMethod
import androidx.compose.foundation.BorderStroke

/**
 * Step 4: Prizes and Selection Method
 * 
 * Implements:
 * - Subtask 8.1: Prize distribution configuration with Kr conversion
 * - Subtask 8.2: Selection method configuration with paid voting
 * - Subtask 8.3: Milestone airdrop configuration
 * 
 * Requirements: 7.1-10.5
 */
@Composable
fun Step4PrizesAndValidation(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    val validationErrors = remember(state) { viewModel.validateStep4() }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Prize Distribution Section (Subtask 8.1)
        PrizeDistributionSection(
            viewModel = viewModel,
            state = state,
            validationErrors = validationErrors
        )
        
        Divider(color = Color(0xFF3A3A3F), thickness = 1.dp)
        
        // Selection Method Section (Subtask 8.2)
        SelectionMethodSection(
            viewModel = viewModel,
            state = state,
            validationErrors = validationErrors
        )
        
        Divider(color = Color(0xFF3A3A3F), thickness = 1.dp)
        
        // Milestone Airdrop Section (Subtask 8.3)
        MilestoneAirdropSection(
            viewModel = viewModel,
            state = state,
            validationErrors = validationErrors
        )
    }
}

/**
 * Prize Distribution Section
 * Subtask 8.1, Requirements 7.1-7.7
 */
@Composable
private fun PrizeDistributionSection(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        Text(
            text = "Prize Distribution",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        Text(
            text = "Configure how prizes will be distributed to winners",
            fontSize = 14.sp,
            color = Color(0xFFA0A0A0)
        )
        
        // Winner Slots Selector (Requirements 7.1, 7.2, 7.3, 7.4)
        WinnerSlotsSelector(
            selectedSlots = state.winnerSlots,
            onSlotsSelected = { viewModel.updateWinnerSlots(it) }
        )
        
        // Dynamic Prize Input Fields (Requirements 7.2, 7.3, 7.4, 7.5, 7.6)
        PrizeInputFields(
            viewModel = viewModel,
            state = state,
            validationErrors = validationErrors
        )
        
        // Total Prize Pool Display (Requirements 7.6, 7.7)
        TotalPrizePoolDisplay(
            viewModel = viewModel,
            state = state
        )
    }
}

/**
 * Winner Slots Selector (1, 2, or 3)
 * Requirements 7.1, 7.2, 7.3, 7.4
 */
@Composable
private fun WinnerSlotsSelector(
    selectedSlots: Int,
    onSlotsSelected: (Int) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = "Number of Winners",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            listOf(1, 2, 3).forEach { slots ->
                OutlinedButton(
                    onClick = { onSlotsSelected(slots) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (selectedSlots == slots) Color(0xFFF5A623) else Color.Transparent,
                        contentColor = if (selectedSlots == slots) Color(0xFF0A0A0F) else Color.White
                    ),
                    border = BorderStroke(
                        width = 2.dp,
                        color = if (selectedSlots == slots) Color(0xFFF5A623) else Color(0xFF3A3A3F)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "$slots",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            }
        }
    }
}

/**
 * Dynamic Prize Input Fields based on winner slots
 * Requirements 7.2, 7.3, 7.4, 7.5, 7.6
 */
@Composable
private fun PrizeInputFields(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        val prizeLabels = listOf("1st Place", "2nd Place", "3rd Place")
        
        repeat(state.winnerSlots) { index ->
            PrizeInputField(
                label = prizeLabels[index],
                amount = state.prizeAmounts.getOrNull(index) ?: 0.0,
                onAmountChange = { viewModel.updatePrizeAmount(index, it) },
                krDisplay = viewModel.getPrizeKrDisplay(state.prizeAmounts.getOrNull(index) ?: 0.0),
                currencyCode = viewModel.getCurrencyCode(),
                error = validationErrors["prizeAmount_$index"]
            )
        }
    }
}

/**
 * Single Prize Input Field with Kr conversion
 * Requirements 7.5, 7.6, 7.7
 */
@Composable
private fun PrizeInputField(
    label: String,
    amount: Double,
    onAmountChange: (Double) -> Unit,
    krDisplay: String,
    currencyCode: String,
    error: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        OutlinedTextField(
            value = if (amount == 0.0) "" else amount.toString(),
            onValueChange = { 
                val newAmount = com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(it, "prizeAmount", 0.0, defaultValue = 0.0)
                onAmountChange(newAmount)
            },
            label = { Text("Prize Amount ($currencyCode)") },
            placeholder = { Text("0.00") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = if (error != null) Color(0xFFFF3B30) else Color(0xFFF5A623),
                cursorColor = Color(0xFFF5A623),
                focusedLabelColor = if (error != null) Color(0xFFFF3B30) else Color(0xFFF5A623),
                unfocusedBorderColor = if (error != null) Color(0xFFFF3B30) else Color(0xFF3A3A3F),
                focusedContainerColor = Color(0xFF1A1A1F),
                unfocusedContainerColor = Color(0xFF1A1A1F),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            shape = RoundedCornerShape(12.dp),
            isError = error != null
        )
        
        // Real-time Kr conversion display (Requirements 7.5, 7.6)
        if (amount > 0.0) {
            Text(
                text = "≈ $krDisplay",
                fontSize = 12.sp,
                color = Color(0xFFF5A623),
                modifier = Modifier.padding(start = 4.dp)
            )
        }
        
        // Validation error message
        if (error != null) {
            Text(
                text = error,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 4.dp)
            )
        }
    }
}

/**
 * Total Prize Pool Display
 * Requirements 7.6, 7.7
 */
@Composable
private fun TotalPrizePoolDisplay(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1F)
        ),
        border = BorderStroke(2.dp, Color(0xFFF5A623)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Total Prize Pool",
                    fontSize = 14.sp,
                    color = Color(0xFFA0A0A0)
                )
                Text(
                    text = "${viewModel.getCurrencyCode()} ${formatString("%.2f", state.totalPrizePool)}",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "In Kr",
                    fontSize = 14.sp,
                    color = Color(0xFFA0A0A0)
                )
                Text(
                    text = viewModel.getTotalPrizePoolKrDisplay(),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFF5A623)
                )
            }
        }
    }
}

/**
 * Selection Method Section
 * Subtask 8.2, Requirements 8.1-9.4
 */
@Composable
private fun SelectionMethodSection(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        Text(
            text = "Winner Selection Method",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        Text(
            text = "Choose how winners will be determined",
            fontSize = 14.sp,
            color = Color(0xFFA0A0A0)
        )
        
        // Selection Method Selector (Requirements 8.1, 8.2, 8.3, 8.4, 8.5)
        SelectionMethodSelector(
            selectedMethod = state.selectionMethod,
            onMethodSelected = { viewModel.updateSelectionMethod(it) }
        )
        
        // Paid Voting Toggle (Requirements 9.1, 9.2, 9.3, 9.4)
        PaidVotingToggle(
            viewModel = viewModel,
            state = state,
            validationErrors = validationErrors
        )
    }
}

/**
 * Selection Method Selector
 * Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SelectionMethodSelector(
    selectedMethod: SelectionMethod,
    onMethodSelected: (SelectionMethod) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = "Selection Method",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = it }
        ) {
            OutlinedTextField(
                value = getSelectionMethodLabel(selectedMethod),
                onValueChange = {},
                readOnly = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFF5A623),
                    unfocusedBorderColor = Color(0xFF3A3A3F),
                    focusedContainerColor = Color(0xFF1A1A1F),
                    unfocusedContainerColor = Color(0xFF1A1A1F),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp)
            )
            
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.exposedDropdownSize()
            ) {
                SelectionMethod.entries.forEach { method ->
                    DropdownMenuItem(
                        text = { 
                            Column {
                                Text(
                                    text = getSelectionMethodLabel(method),
                                    color = if (method == selectedMethod) Color(0xFFF5A623) else Color.White,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = getSelectionMethodDescription(method),
                                    color = Color(0xFFA0A0A0),
                                    fontSize = 12.sp
                                )
                            }
                        },
                        onClick = {
                            onMethodSelected(method)
                            expanded = false
                        },
                        colors = MenuDefaults.itemColors(
                            textColor = Color.White
                        )
                    )
                }
            }
        }
    }
}

/**
 * Paid Voting Toggle with mutual exclusivity validation
 * Requirements 9.1, 9.2, 9.3, 9.4
 */
@Composable
private fun PaidVotingToggle(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF1A1A1F)
            ),
            border = BorderStroke(
                width = 1.dp,
                color = if (validationErrors["mutualExclusivity"] != null) Color(0xFFFF3B30) else Color(0xFF3A3A3F)
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Paid Voting",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White
                    )
                    Text(
                        text = "Users pay Kr to vote for submissions",
                        fontSize = 12.sp,
                        color = Color(0xFFA0A0A0)
                    )
                }
                
                Switch(
                    checked = state.paidVoting,
                    onCheckedChange = { viewModel.updatePaidVoting(it) },
                    enabled = state.entryFee == 0.0,
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color(0xFF0A0A0F),
                        checkedTrackColor = Color(0xFFF5A623),
                        uncheckedThumbColor = Color(0xFFA0A0A0),
                        uncheckedTrackColor = Color(0xFF3A3A3F),
                        disabledCheckedThumbColor = Color(0xFF0A0A0F),
                        disabledCheckedTrackColor = Color(0xFFF5A623).copy(alpha = 0.5f),
                        disabledUncheckedThumbColor = Color(0xFFA0A0A0).copy(alpha = 0.5f),
                        disabledUncheckedTrackColor = Color(0xFF3A3A3F).copy(alpha = 0.5f)
                    )
                )
            }
        }
        
        // Mutual exclusivity validation error (Requirements 9.2, 9.3, 9.4)
        if (validationErrors["mutualExclusivity"] != null) {
            Text(
                text = validationErrors["mutualExclusivity"]!!,
                color = Color(0xFFFF3B30),
                fontSize = 14.sp,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
        }
    }
}

/**
 * Milestone Airdrop Section
 * Subtask 8.3, Requirements 10.1-10.5
 */
@Composable
private fun MilestoneAirdropSection(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        Text(
            text = "Milestone Airdrop (Optional)",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        Text(
            text = "Reward early participants to create FOMO",
            fontSize = 14.sp,
            color = Color(0xFFA0A0A0)
        )
        
        // Milestone Airdrop Toggle (Requirement 10.1)
        MilestoneAirdropToggle(
            enabled = state.milestoneAirdropEnabled,
            onToggle = { viewModel.updateMilestoneAirdropEnabled(it) }
        )
        
        // Conditional Airdrop Configuration Fields (Requirements 10.2, 10.3, 10.4, 10.5)
        if (state.milestoneAirdropEnabled) {
            AirdropConfigurationFields(
                viewModel = viewModel,
                state = state,
                validationErrors = validationErrors
            )
        }
    }
}

/**
 * Milestone Airdrop Toggle Switch
 * Requirement 10.1
 */
@Composable
private fun MilestoneAirdropToggle(
    enabled: Boolean,
    onToggle: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1F)
        ),
        border = BorderStroke(1.dp, Color(0xFF3A3A3F)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Enable Milestone Airdrop",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White
                )
                Text(
                    text = "Distribute Kr to first N participants",
                    fontSize = 12.sp,
                    color = Color(0xFFA0A0A0)
                )
            }
            
            Switch(
                checked = enabled,
                onCheckedChange = onToggle,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color(0xFF0A0A0F),
                    checkedTrackColor = Color(0xFFF5A623),
                    uncheckedThumbColor = Color(0xFFA0A0A0),
                    uncheckedTrackColor = Color(0xFF3A3A3F)
                )
            )
        }
    }
}

/**
 * Airdrop Configuration Fields
 * Requirements 10.2, 10.3, 10.4, 10.5
 */
@Composable
private fun AirdropConfigurationFields(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Airdrop Kr Amount Input (Requirements 10.2, 10.4)
        AirdropAmountInput(
            viewModel = viewModel,
            amount = state.milestoneAirdropAmount,
            onAmountChange = { viewModel.updateMilestoneAirdropAmount(it) },
            error = validationErrors["milestoneAirdropAmount"]
        )
        
        // Airdrop Participant Limit Input (Requirements 10.3, 10.5)
        AirdropLimitInput(
            limit = state.milestoneAirdropLimit,
            onLimitChange = { viewModel.updateMilestoneAirdropLimit(it) },
            error = validationErrors["milestoneAirdropLimit"]
        )
    }
}

/**
 * Airdrop Kr Amount Input Field
 * Requirements 10.2, 10.3, 10.4
 * Task 13.2: Add real-time Kr conversion for airdrop amounts
 */
@Composable
private fun AirdropAmountInput(
    viewModel: CreateContestViewModel,
    amount: Double,
    onAmountChange: (Double) -> Unit,
    error: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = "Kr Amount per Participant",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        OutlinedTextField(
            value = if (amount == 0.0) "" else amount.toString(),
            onValueChange = { 
                val newAmount = com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(it, "prizeAmount", 0.0, defaultValue = 0.0)
                onAmountChange(newAmount)
            },
            label = { Text("Kr Amount") },
            placeholder = { Text("0.00") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = if (error != null) Color(0xFFFF3B30) else Color(0xFFF5A623),
                cursorColor = Color(0xFFF5A623),
                focusedLabelColor = if (error != null) Color(0xFFFF3B30) else Color(0xFFF5A623),
                unfocusedBorderColor = if (error != null) Color(0xFFFF3B30) else Color(0xFF3A3A3F),
                focusedContainerColor = Color(0xFF1A1A1F),
                unfocusedContainerColor = Color(0xFF1A1A1F),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            shape = RoundedCornerShape(12.dp),
            isError = error != null
        )
        
        // Real-time Kr conversion display (Requirement 10.3, Task 13.2)
        if (amount > 0.0) {
            val currencyCode = viewModel.getCurrencyCode()
            val fiatAmount = viewModel.convertToFiat(amount, applyMargin = false)
            Text(
                text = "≈ $currencyCode ${formatString("%.2f", fiatAmount)}",
                fontSize = 12.sp,
                color = Color(0xFFF5A623),
                modifier = Modifier.padding(start = 4.dp)
            )
        }
        
        // Validation error message
        if (error != null) {
            Text(
                text = error,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 4.dp)
            )
        }
    }
}

/**
 * Airdrop Participant Limit Input Field
 * Requirements 10.3, 10.5
 */
@Composable
private fun AirdropLimitInput(
    limit: Int,
    onLimitChange: (Int) -> Unit,
    error: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = "Participant Limit",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        OutlinedTextField(
            value = if (limit == 0) "" else limit.toString(),
            onValueChange = { 
                val newLimit = it.toIntOrNull() ?: 0
                onLimitChange(newLimit)
            },
            label = { Text("Number of Participants") },
            placeholder = { Text("0") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = if (error != null) Color(0xFFFF3B30) else Color(0xFFF5A623),
                cursorColor = Color(0xFFF5A623),
                focusedLabelColor = if (error != null) Color(0xFFFF3B30) else Color(0xFFF5A623),
                unfocusedBorderColor = if (error != null) Color(0xFFFF3B30) else Color(0xFF3A3A3F),
                focusedContainerColor = Color(0xFF1A1A1F),
                unfocusedContainerColor = Color(0xFF1A1A1F),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            shape = RoundedCornerShape(12.dp),
            isError = error != null
        )
        
        // Validation error message
        if (error != null) {
            Text(
                text = error,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 4.dp)
            )
        }
    }
}

/**
 * Helper function to get human-readable selection method labels
 */
private fun getSelectionMethodLabel(method: SelectionMethod): String {
    return when (method) {
        SelectionMethod.MANUAL -> "Manual Selection"
        SelectionMethod.RANDOM -> "Random Selection"
        SelectionMethod.VOTING -> "Community Voting"
        SelectionMethod.COMBINATION -> "Combination"
    }
}

/**
 * Helper function to get selection method descriptions
 */
private fun getSelectionMethodDescription(method: SelectionMethod): String {
    return when (method) {
        SelectionMethod.MANUAL -> "Judges manually select winners"
        SelectionMethod.RANDOM -> "Winners selected randomly"
        SelectionMethod.VOTING -> "Community votes for winners"
        SelectionMethod.COMBINATION -> "Judges + voting combined"
    }
}



