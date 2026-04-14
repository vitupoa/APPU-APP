package com.krieta.feature.contests.presentation.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.presentation.viewmodel.ContestJudgeViewModel
import com.krieta.feature.contests.domain.model.ContestStatus

class ContestJudgeDashboardScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ContestJudgeViewModel>()
        val state by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Judge Dashboard", fontWeight = FontWeight.Bold) },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                )
            }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                
                // Alert Banner Explaining the 72H constraints inherently
                Surface(color = MaterialTheme.colorScheme.errorContainer, shape = MaterialTheme.shapes.medium) {
                    Text(
                        text = "⏱️ WARNING: Pending contests require verification within 72 hours of completion. Failure to Review auto-releases Escrow funds permanently!",
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.labelMedium
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                when (val currentState = state) {
                    is com.krieta.feature.contests.presentation.viewmodel.JudgeState.Loading -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                    }
                    is com.krieta.feature.contests.presentation.viewmodel.JudgeState.Success -> {
                        if (currentState.assignedContests.isEmpty()) {
                            Text("You have no pending Contests requiring your moderation.")
                        } else {
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                items(currentState.assignedContests) { contest ->
                                    JudgeContestCard(
                                        contest = contest,
                                        onOpenEntries = {
                                            // Bridge into Explicit Submissions Moderation Screen mapping User Proof properly!
                                            navigator.push(ContestModerationScreen(contest.id))
                                        }
                                    )
                                }
                            }
                        }
                    }
                    else -> {}
                }
            }
        }
    }

    @Composable
    private fun JudgeContestCard(contest: Contest, onOpenEntries: () -> Unit) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                 Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                     Text(contest.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                     
                     val statusColor = if(contest.status == ContestStatus.PENDING_PAYOUT) Color.Red else Color.Green
                     Text(contest.status.name, color = statusColor, style = MaterialTheme.typography.labelSmall)
                 }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Text("Total Entries: ${contest.submissionsCount}", style = MaterialTheme.typography.bodySmall)
                    
                    if (contest.status == ContestStatus.PENDING_PAYOUT) {
                        Text("🕒 Time Remaining: 48h 12m", color = Color.Red, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(onClick = onOpenEntries, modifier = Modifier.weight(1f)) {
                        Text("Review Entries / Approve")
                    }
                }
            }
        }
    }
}
