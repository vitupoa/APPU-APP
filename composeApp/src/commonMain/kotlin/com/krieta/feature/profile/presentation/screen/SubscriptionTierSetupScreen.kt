package com.krieta.feature.profile.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.profile.presentation.viewmodel.SubscriptionTierSetupViewModel
import com.krieta.feature.profile.presentation.viewmodel.TierDraft

class SubscriptionTierSetupScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<SubscriptionTierSetupViewModel>()
        val state by viewModel.state.collectAsState()

        LaunchedEffect(state.saveSuccess) {
            if (state.saveSuccess) navigator.pop()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Subscription Tiers") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                        }
                    }
                )
            }
        ) { padding ->
            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                else -> Column(
                    modifier = Modifier.fillMaxSize().padding(padding)
                ) {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            Text(
                                "Configure your subscription tiers. Subscribers pay monthly in Kr.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        items(state.tiers) { tier ->
                            TierSetupCard(
                                draft = tier,
                                onAmountChange = { viewModel.updateTierAmount(tier.tier, it) },
                                onBenefitsChange = { viewModel.updateTierBenefits(tier.tier, it) },
                                onToggleEnabled = { viewModel.toggleTierEnabled(tier.tier) }
                            )
                        }
                    }

                    // Error
                    state.error?.let {
                        Text(
                            it,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(horizontal = 16.dp),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    // Save button
                    Button(
                        onClick = { viewModel.save() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        enabled = !state.isSaving
                    ) {
                        if (state.isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Save Tiers", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun TierSetupCard(
        draft: TierDraft,
        onAmountChange: (String) -> Unit,
        onBenefitsChange: (String) -> Unit,
        onToggleEnabled: () -> Unit
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = if (draft.isEnabled)
                CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f))
            else CardDefaults.cardColors()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            draft.tier.name.replace("_", " "),
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            tierDescription(draft.tier.name),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = draft.isEnabled,
                        onCheckedChange = { onToggleEnabled() }
                    )
                }

                if (draft.isEnabled) {
                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = draft.krAmount,
                        onValueChange = onAmountChange,
                        label = { Text("Monthly Price (Kr)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = draft.benefits,
                        onValueChange = onBenefitsChange,
                        label = { Text("Benefits Description") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3,
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("What do subscribers get at this tier?") }
                    )
                }
            }
        }
    }

    private fun tierDescription(tierName: String): String = when (tierName) {
        "TOP_FUN" -> "Entry level — casual supporters"
        "REAL_FAN" -> "Regular fans with extra perks"
        "TRUE_FAN" -> "Dedicated supporters with premium access"
        "SUPER_FAN" -> "VIP tier — all exclusive content"
        else -> ""
    }
}

