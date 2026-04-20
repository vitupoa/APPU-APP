package com.krieta.feature.contests.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.feature.contests.presentation.viewmodel.JudgeInvitationsViewModel

/**
 * Screen for viewing and managing judge invitations
 * Shows pending invitations that the user can accept or decline
 */
class JudgeInvitationsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<JudgeInvitationsViewModel>()
        val state by viewModel.state.collectAsState()

        LaunchedEffect(Unit) {
            viewModel.loadInvitations()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            "Judge Invitations", 
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        ) 
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack, 
                                contentDescription = "Back",
                                tint = Color.White
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF0A0A0F)
                    )
                )
            },
            containerColor = Color(0xFF0A0A0F)
        ) { padding ->
            when {
                state.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = Color(0xFFF5A623))
                    }
                }
                state.error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = state.error ?: "An error occurred",
                                color = Color(0xFFFF3B30),
                                fontSize = 14.sp
                            )
                            Button(
                                onClick = { viewModel.loadInvitations() },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFFF5A623)
                                )
                            ) {
                                Text("Retry", color = Color.Black)
                            }
                        }
                    }
                }
                state.invitations.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No pending invitations",
                            color = Color(0xFFA0A0A0),
                            fontSize = 16.sp
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(state.invitations) { invite ->
                            JudgeInvitationCard(
                                invite = invite,
                                onAccept = { viewModel.acceptInvite(invite.id) },
                                onDecline = { viewModel.declineInvite(invite.id) },
                                isProcessing = state.processingInviteId == invite.id
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun JudgeInvitationCard(
    invite: com.krieta.feature.contests.domain.model.JudgeInvite,
    onAccept: () -> Unit,
    onDecline: () -> Unit,
    isProcessing: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1F)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Contest Info
            invite.contest?.let { contest ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Contest Cover Image
                    if (contest.coverMediaUrl != null) {
                        AsyncImage(
                            model = contest.coverMediaUrl,
                            contentDescription = "Contest cover",
                            modifier = Modifier
                                .size(60.dp)
                                .clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(60.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF3A3A3F)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = contest.title.firstOrNull()?.uppercase() ?: "?",
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                    
                    // Contest Details
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = contest.title,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "by @${contest.creatorUsername}",
                            fontSize = 12.sp,
                            color = Color(0xFFA0A0A0)
                        )
                        Text(
                            text = "Prize: Kr.${String.format("%.2f", contest.prizeKr)}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFF5A623)
                        )
                    }
                }
                
                // Contest Description
                Text(
                    text = contest.description,
                    fontSize = 14.sp,
                    color = Color(0xFFCCCCCC),
                    maxLines = 2
                )
                
                Divider(color = Color(0xFF3A3A3F))
            }
            
            // Invitation Message
            Text(
                text = "You've been invited to judge this contest",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White
            )
            
            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Decline Button
                OutlinedButton(
                    onClick = onDecline,
                    enabled = !isProcessing,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color(0xFFFF3B30)
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        Color(0xFFFF3B30)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (isProcessing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color(0xFFFF3B30),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Decline")
                    }
                }
                
                // Accept Button
                Button(
                    onClick = onAccept,
                    enabled = !isProcessing,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFF5A623),
                        contentColor = Color.Black
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (isProcessing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.Black,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Accept")
                    }
                }
            }
        }
    }
}
