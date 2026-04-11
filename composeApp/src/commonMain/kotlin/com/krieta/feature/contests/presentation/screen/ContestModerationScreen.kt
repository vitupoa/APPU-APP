package com.krieta.feature.contests.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.contests.domain.model.ContestSubmission
import com.krieta.feature.contests.presentation.viewmodel.ContestJudgeViewModel

class ContestModerationScreen(private val contestId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = getScreenModel<ContestJudgeViewModel>()
        
        // This Stateflow specifically polls `ContestSubmission` records tied to `contestId` mapping users natively
        val state by viewModel.submissionState.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Review Submissions", fontWeight = FontWeight.Bold) },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    navigationIcon = {
                        TextButton(onClick = { navigator.pop() }) { Text("Back") }
                    }
                )
            }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                
                when (val currentState = state) {
                    is com.krieta.feature.contests.presentation.viewmodel.SubmissionState.Loading -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                    }
                    is com.krieta.feature.contests.presentation.viewmodel.SubmissionState.Success -> {
                        val entries = currentState.entries.filter { it.contestId == contestId }
                        
                        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
                             items(entries) { entry ->
                                ModerationEntryCard(
                                    entry = entry,
                                    onApproveProof = { viewModel.approveProofVerification(entry.id) },
                                    onRejectProof = { viewModel.rejectFraudulentProof(entry.id) },
                                    onSelectWinner = { viewModel.selectWinner(entry.id) },
                                    onRevokeWin = { viewModel.revokeWinnerStatus(entry.id) }
                                )
                             }
                        }
                    }
                    else -> {}
                }
            }
        }
    }

    @Composable
    private fun ModerationEntryCard(
        entry: ContestSubmission,
        onApproveProof: () -> Unit,
        onRejectProof: () -> Unit,
        onSelectWinner: () -> Unit,
        onRevokeWin: () -> Unit
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Header User Context
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                     Text("User ID: ${entry.user.id.take(8)}...", fontWeight = FontWeight.Bold)
                     Text("Community Votes: ${entry.votes}", color = MaterialTheme.colorScheme.primary)
                }
                
                Spacer(modifier = Modifier.height(12.dp))

                // The Media Playback Frame
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(250.dp)
                        .background(Color.Black, shape = RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    if (entry.mediaType == "VIDEO") {
                         Text("ExoPlayer Video Logic Mounted Here", color = Color.White)
                    } else {
                         Text("Image Logic Mounted Here", color = Color.White)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                
                if (entry.proofScreenshots.isNotEmpty()) {
                     Text("Attached Proof Documents: ${entry.proofScreenshots.size}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                     // Here we layout a LazyRow showing the Cloudinary Screenshot proofs explicitly for the judge!
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(16.dp))

                // Verification Operations
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                     OutlinedButton(onClick = onApproveProof, modifier = Modifier.weight(1f)) { Text("Approve Proof") }
                     Button(onClick = onRejectProof, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error), modifier = Modifier.weight(1f)) { 
                         Text("Reject Proof") 
                     }
                }
                
                Spacer(modifier = Modifier.height(8.dp))

                // Judging Operations
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                     Button(
                         onClick = onSelectWinner,
                         modifier = Modifier.weight(1f),
                         colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFD700)) // Gold!
                     ) { 
                         Text("👑 SELECT AS WINNER", color = Color.Black) 
                     }
                     
                     if (entry.rank != null) {
                         FilledTonalButton(onClick = onRevokeWin, modifier = Modifier.weight(1f)) {
                             Text("Revoke Win")
                         }
                     }
                }
            }
        }
    }
}
