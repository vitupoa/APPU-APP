package com.krieta.feature.chama.presentation.election
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.chama.data.remote.dto.ChamaNominationDto
import org.koin.core.parameter.parametersOf

class ChamaElectionScreen(
    private val chamaId: String,
    private val electionId: String
) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = getScreenModel<ChamaElectionViewModel> { parametersOf(chamaId, electionId) }
        val state by viewModel.state.collectAsState()

        val snackbarHostState = remember { SnackbarHostState() }
        LaunchedEffect(state.error, state.successMessage) {
            val msg = state.successMessage ?: state.error
            if (msg != null) {
                snackbarHostState.showSnackbar(msg)
                viewModel.clearMessages()
            }
        }

        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                TopAppBar(
                    title = { Text("Election Details", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back")
                        }
                    }
                )
            }
        ) { padding ->
            if (state.isLoading) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFFF5A623))
                }
            } else if (state.election != null) {
                val election = state.election!!
                Column(
                    modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)
                ) {
                    Text(
                        "Position: ${election.position}",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Spacer(Modifier.height(8.dp))
                    
                    Surface(
                        color = when (election.phase) {
                            "NOMINATION" -> Color(0xFFF5A623).copy(alpha = 0.2f)
                            "SECONDING" -> Color(0xFF3498DB).copy(alpha = 0.2f)
                            "VOTING" -> Color(0xFF2ECC71).copy(alpha = 0.2f)
                            else -> MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                        },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "Phase: ${election.phase}",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            color = when (election.phase) {
                                "NOMINATION" -> Color(0xFFF5A623)
                                "SECONDING" -> Color(0xFF3498DB)
                                "VOTING" -> Color(0xFF2ECC71)
                                else -> MaterialTheme.colorScheme.primary
                            },
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(Modifier.height(24.dp))
                    Text("Candidates", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))

                    if (election.nominations.isNullOrEmpty()) {
                        Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text("No nominations yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(election.nominations) { nomination ->
                                CandidateCard(
                                    nomination = nomination,
                                    phase = election.phase,
                                    isActionLoading = state.isActionLoading,
                                    onSecond = { viewModel.secondNomination(nomination.id) },
                                    onVote = { viewModel.vote(nomination.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun CandidateCard(
        nomination: ChamaNominationDto,
        phase: String,
        isActionLoading: Boolean,
        onSecond: () -> Unit,
        onVote: () -> Unit
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    nomination.nominee?.displayName ?: "Unknown Candidate",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Text(
                    "Nominated by: ${nomination.nominator?.displayName ?: "Unknown"}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Column {
                            Text("Seconds", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("${nomination.secondsCount}", fontWeight = FontWeight.SemiBold)
                        }
                        if (phase == "VOTING" || phase == "COMPLETED") {
                            Column {
                                Text("Votes", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("${nomination._count?.votes ?: 0}", fontWeight = FontWeight.Bold, color = Color(0xFF2ECC71))
                            }
                        }
                    }

                    if (phase == "SECONDING" || phase == "NOMINATION") {
                        Button(
                            onClick = onSecond,
                            enabled = !isActionLoading,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3498DB))
                        ) {
                            Text("Second")
                        }
                    } else if (phase == "VOTING") {
                        Button(
                            onClick = onVote,
                            enabled = !isActionLoading,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2ECC71))
                        ) {
                            Text("Vote")
                        }
                    }
                }
            }
        }
    }
}
