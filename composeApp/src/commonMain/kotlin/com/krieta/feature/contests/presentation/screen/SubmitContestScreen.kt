package com.krieta.feature.contests.presentation.screen

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.feature.contests.domain.model.ContestAction
import com.krieta.feature.contests.presentation.viewmodel.SubmitContestViewModel
import org.koin.core.parameter.parametersOf

data class SubmitContestScreen(val contestId: String) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val viewModel = koinScreenModel<SubmitContestViewModel> { parametersOf(contestId) }
        val navigator = LocalNavigator.currentOrThrow
        val state = viewModel.state

        LaunchedEffect(state.success) {
            if (state.success) {
                navigator.pop()
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Submit Entry") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
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
                state.contest?.let { contest ->
                    item {
                        ContestInfoCard(
                            title = contest.title,
                            coverUrl = contest.coverMediaUrl,
                            prizeKr = contest.prizeKr
                        )
                    }
                }

                if (state.hasSubmitted) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(Icons.Default.Info, null, tint = MaterialTheme.colorScheme.error)
                                Text(
                                    "You have already submitted an entry to this contest",
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                        }
                    }
                } else {
                    item {
                        Text(
                            "Requirements",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    items(state.requirements) { action ->
                        RequirementItem(action = action)
                    }

                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                        Text(
                            "Your Submission",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    item {
                        MediaUploadSection(
                            selectedMediaUri = state.selectedMediaUri,
                            uploading = state.uploadingMedia,
                            onMediaSelected = viewModel::onMediaSelected,
                            onUploadComplete = viewModel::onMediaUploaded,
                            setUploading = viewModel::setUploadingMedia
                        )
                    }

                    if (state.requirements.any { it.requiresUpload }) {
                        item {
                            Text(
                                "Proof Screenshots",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        item {
                            ProofUploadSection(
                                proofUris = state.proofUris,
                                uploading = state.uploadingProof,
                                onProofAdded = viewModel::onProofAdded,
                                onProofRemoved = viewModel::onProofRemoved,
                                onUploadComplete = viewModel::onProofUploaded,
                                setUploading = viewModel::setUploadingProof
                            )
                        }
                    }

                    state.error?.let { error ->
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                            ) {
                                Text(
                                    error,
                                    modifier = Modifier.padding(16.dp),
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                        }
                    }

                    item {
                        Button(
                            onClick = viewModel::submitEntry,
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.submitting && state.selectedMediaUri != null && state.canSubmit,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFC107))
                        ) {
                            if (state.submitting) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = Color.Black
                                )
                            } else {
                                Text("Submit Entry", color = Color.Black)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ContestInfoCard(title: String, coverUrl: String?, prizeKr: Double) {
    Card {
        Column(modifier = Modifier.padding(16.dp)) {
            coverUrl?.let {
                AsyncImage(
                    model = it,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
                Spacer(Modifier.height(12.dp))
            }
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text("Prize: ${prizeKr.toInt()} Kr", style = MaterialTheme.typography.bodyLarge, color = Color(0xFFFFC107))
        }
    }
}

@Composable
private fun RequirementItem(action: ContestAction) {
    Card {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = when (action.actionType) {
                    "FOLLOW_KRIETA" -> painterResource(Res.drawable.ic_person)
                    "YOUTUBE_SUB" -> Icons.Default.PlayArrow
                    "INSTAGRAM_FOLLOW" -> Icons.Default.Camera
                    "TIKTOK_FOLLOW" -> Icons.Default.MusicNote
                    "WATCH_VIDEO" -> Icons.Default.PlayCircle
                    "VISIT_SHOP" -> Icons.Default.ShoppingCart
                    else -> painterResource(Res.drawable.ic_check)Circle
                },
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(action.label, fontWeight = FontWeight.Medium)
                if (action.requiresUpload) {
                    Text(
                        "Proof required",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }
            if (action.targetUrl != null) {
                Icon(Icons.AutoMirrored.Filled.OpenInNew, "Open", tint = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Composable
private fun MediaUploadSection(
    selectedMediaUri: String?,
    uploading: Boolean,
    onMediaSelected: (String) -> Unit,
    onUploadComplete: (String) -> Unit,
    setUploading: (Boolean) -> Unit
) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (selectedMediaUri != null) {
                AsyncImage(
                    model = selectedMediaUri,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .clickable { /* Open media picker */ },
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(painterResource(Res.drawable.ic_add), null, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(8.dp))
                        Text("Select Photo or Video")
                    }
                }
            }

            if (uploading) {
                Spacer(Modifier.height(8.dp))
                CircularProgressIndicator()
            }
        }
    }
}

@Composable
private fun ProofUploadSection(
    proofUris: List<String>,
    uploading: Boolean,
    onProofAdded: (String) -> Unit,
    onProofRemoved: (String) -> Unit,
    onUploadComplete: (String) -> Unit,
    setUploading: (Boolean) -> Unit
) {
    Card {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                proofUris.forEach { uri ->
                    Box {
                        AsyncImage(
                            model = uri,
                            contentDescription = null,
                            modifier = Modifier
                                .size(80.dp)
                                .clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        IconButton(
                            onClick = { onProofRemoved(uri) },
                            modifier = Modifier.align(Alignment.TopEnd)
                        ) {
                            Icon(painterResource(Res.drawable.ic_close), "Remove", tint = Color.White)
                        }
                    }
                }

                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .clickable { /* Open image picker */ },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(painterResource(Res.drawable.ic_add), "Add proof")
                }
            }

            if (uploading) {
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
        }
    }
}
