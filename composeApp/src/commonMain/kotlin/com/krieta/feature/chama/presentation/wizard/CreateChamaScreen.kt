package com.krieta.feature.chama.presentation.wizard

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.shape.CircleShape
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

private val ChamaGold = Color(0xFFF5A623)
private val ChamaGoldDark = Color(0xFFD4891A)
private val ChamaGreen = Color(0xFF2ECC71)

class CreateChamaScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<CreateChamaViewModel>()
        val state by viewModel.state.collectAsState()

        LaunchedEffect(state.createdChama) {
            if (state.createdChama != null) {
                navigator.pop()
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Create Chama", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = {
                            if (state.currentStep > 0) viewModel.previousStep()
                            else navigator.pop()
                        }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back")
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                StepIndicator(current = state.currentStep, total = viewModel.totalSteps)

                AnimatedContent(
                    targetState = state.currentStep,
                    transitionSpec = {
                        if (targetState > initialState) {
                            slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                        } else {
                            slideInHorizontally { -it } togetherWith slideOutHorizontally { it }
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) { step ->
                    when (step) {
                        0 -> StepBasicInfo(state, viewModel)
                        1 -> StepFinancials(state, viewModel)
                        2 -> StepRules(state, viewModel)
                        3 -> StepConfirmation(state)
                    }
                }

                if (state.error != null) {
                    Text(
                        state.error!!,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(horizontal = 20.dp),
                        fontSize = 13.sp
                    )
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (state.currentStep > 0) {
                        OutlinedButton(
                            onClick = { viewModel.previousStep() },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text("Back")
                        }
                    }

                    Button(
                        onClick = {
                            if (state.currentStep == viewModel.totalSteps - 1) {
                                viewModel.createChama()
                            } else {
                                viewModel.nextStep()
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = viewModel.canProceed() && !state.isLoading,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ChamaGold
                        )
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                        } else {
                            Text(
                                if (state.currentStep == viewModel.totalSteps - 1) "Create Chama"
                                else "Next",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StepIndicator(current: Int, total: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        repeat(total) { index ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        if (index <= current) ChamaGold
                        else MaterialTheme.colorScheme.surfaceVariant
                    )
            )
        }
    }
}

@Composable
private fun StepBasicInfo(state: CreateChamaState, viewModel: CreateChamaViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("What's your Chama about?", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text(
            "Choose a name and type for your savings group.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 14.sp
        )

        OutlinedTextField(
            value = state.name,
            onValueChange = { viewModel.updateName(it) },
            label = { Text("Chama Name") },
            placeholder = { Text("e.g. Mjengo Fund") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(14.dp)
        )

        Text("Chama Type", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
        val types = listOf(
            Triple("ROTATING", "Merry-Go-Round", painterResource(Res.drawable.ic_sync)),
            Triple("INVESTMENT", "Investment", painterResource(Res.drawable.ic_trending_up)),
            Triple("WELFARE", "Welfare", painterResource(Res.drawable.ic_favorite)),
            Triple("HYBRID", "Hybrid", painterResource(Res.drawable.ic_dashboard))
        )
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            types.forEach { (value, label, icon) ->
                ChamaTypeCard(
                    label = label,
                    icon = icon,
                    selected = state.type == value,
                    onClick = { viewModel.updateType(value) }
                )
            }
        }

        OutlinedTextField(
            value = state.description,
            onValueChange = { viewModel.updateDescription(it) },
            label = { Text("Description (optional)") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 2,
            maxLines = 4,
            shape = RoundedCornerShape(14.dp)
        )

        OutlinedTextField(
            value = state.reason,
            onValueChange = { viewModel.updateReason(it) },
            label = { Text("Purpose (optional)") },
            placeholder = { Text("e.g. School fees, Emergency fund") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(14.dp)
        )
    }
}

@Composable
private fun ChamaTypeCard(label: String, icon: Painter, selected: Boolean, onClick: () -> Unit) {
    val containerColor = if (selected) ChamaGold.copy(alpha = 0.12f)
    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
    val borderColor = if (selected) ChamaGold else Color.Transparent

    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).border(1.5.dp, borderColor, RoundedCornerShape(14.dp)),
        shape = RoundedCornerShape(14.dp),
        color = containerColor
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (selected) ChamaGold else MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                label,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                color = if (selected) ChamaGold else MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.weight(1f))
            if (selected) {
                Icon(painterResource(Res.drawable.ic_check_circle), contentDescription = null, tint = ChamaGold)
            }
        }
    }
}

@Composable
private fun StepFinancials(state: CreateChamaState, viewModel: CreateChamaViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("Financial Settings", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text(
            "Set contribution amounts and frequency.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 14.sp
        )

        OutlinedTextField(
            value = state.contributionAmountKr,
            onValueChange = { viewModel.updateContributionAmountKr(it) },
            label = { Text("Contribution Amount (Kr)") },
            placeholder = { Text("e.g. 1000") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(14.dp),
            leadingIcon = { Text("Kr", fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 12.dp)) }
        )

        Text("Contribution Frequency", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
        val frequencies = listOf("DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "ONE_OFF")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            frequencies.forEach { freq ->
                val selected = state.contributionFrequency == freq
                FilterChip(
                    selected = selected,
                    onClick = { viewModel.updateContributionFrequency(freq) },
                    label = {
                        Text(
                            freq.lowercase().replace("_", "-"),
                            fontSize = 12.sp
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = ChamaGold.copy(alpha = 0.15f),
                        selectedLabelColor = ChamaGold
                    )
                )
            }
        }

        OutlinedTextField(
            value = state.membershipFeeKr,
            onValueChange = { viewModel.updateMembershipFeeKr(it) },
            label = { Text("Membership Fee (optional)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(14.dp)
        )

        OutlinedTextField(
            value = state.maxMembers,
            onValueChange = { viewModel.updateMaxMembers(it) },
            label = { Text("Max Members (optional)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(14.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Auto-lock when full")
            Switch(
                checked = state.autoLockOnFull,
                onCheckedChange = { viewModel.updateAutoLockOnFull(it) },
                colors = SwitchDefaults.colors(checkedThumbColor = ChamaGold)
            )
        }
    }
}

@Composable
private fun StepRules(state: CreateChamaState, viewModel: CreateChamaViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("Governance Rules", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text(
            "Configure penalties, approvals, and voting rules.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 14.sp
        )

        OutlinedTextField(
            value = state.penaltyAmountKr,
            onValueChange = { viewModel.updatePenaltyAmountKr(it) },
            label = { Text("Late Penalty (Kr, optional)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(14.dp)
        )

        OutlinedTextField(
            value = state.gracePeriodDays,
            onValueChange = { viewModel.updateGracePeriodDays(it) },
            label = { Text("Grace Period (days)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(14.dp)
        )

        OutlinedTextField(
            value = state.minApprovals,
            onValueChange = { viewModel.updateMinApprovals(it) },
            label = { Text("Min. Approvals for Payouts") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(14.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Allow Mid-Term Vote-Out", fontWeight = FontWeight.Medium)
                Text(
                    "Members can vote officials out before term ends",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Switch(
                checked = state.allowMidTermVoteOut,
                onCheckedChange = { viewModel.updateAllowMidTermVoteOut(it) },
                colors = SwitchDefaults.colors(checkedThumbColor = ChamaGold)
            )
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF1A3A2A)
            ),
            shape = RoundedCornerShape(14.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(painterResource(Res.drawable.ic_lock), contentDescription = null, tint = ChamaGreen)
                Column {
                    Text("Wallet Lock Policy", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                    Text(
                        "For Merry-Go-Round chamas, members' personal Kr wallet withdrawals are locked until the full rotation completes. Outstanding debts are auto-deducted.",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                }
            }
        }
    }
}

@Composable
private fun StepConfirmation(state: CreateChamaState) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Review & Confirm", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text(
            "Double-check everything before creating.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 14.sp
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ConfirmRow("Name", state.name)
                ConfirmRow("Type", state.type.lowercase().replaceFirstChar { it.uppercase() })
                ConfirmRow("Contribution", "${state.contributionAmountKr} Kr")
                ConfirmRow("Frequency", state.contributionFrequency.lowercase().replace("_", "-"))
                if (state.membershipFeeKr.isNotBlank()) ConfirmRow("Membership Fee", "${state.membershipFeeKr} Kr")
                if (state.maxMembers.isNotBlank()) ConfirmRow("Max Members", state.maxMembers)
                if (state.penaltyAmountKr.isNotBlank()) ConfirmRow("Late Penalty", "${state.penaltyAmountKr} Kr")
                ConfirmRow("Grace Period", "${state.gracePeriodDays} days")
                ConfirmRow("Min. Approvals", state.minApprovals)
                ConfirmRow("Mid-Term Vote-Out", if (state.allowMidTermVoteOut) "Allowed" else "Disabled")
                if (state.description.isNotBlank()) ConfirmRow("Description", state.description)
            }
        }

        if (state.type == "ROTATING") {
            Card(
                modifier = Modifier.fillMaxWidth().border(1.dp, ChamaGold.copy(alpha = 0.3f), RoundedCornerShape(14.dp)),
                colors = CardDefaults.cardColors(containerColor = ChamaGold.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(painterResource(Res.drawable.ic_info), contentDescription = null, tint = ChamaGold)
                    Text(
                        "Merry-Go-Round: Each member's personal wallet withdrawals will be locked until the full rotation completes.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
private fun ConfirmRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
        Text(value, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
}
