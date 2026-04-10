package com.krieta.feature.contests.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.contests.domain.model.ContestStatus
import com.krieta.feature.contests.domain.model.ContestSubmission
import com.krieta.feature.contests.presentation.viewmodel.ContestDetailViewModel
import org.koin.core.parameter.parametersOf
import cafe.adriel.voyager.koin.getScreenModel

class ContestDetailScreen(private val contestId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val uriHandler = LocalUriHandler.current
        val viewModel = getScreenModel<ContestDetailViewModel>(parameters = { parametersOf(contestId) })
        val state by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(state.contest?.title ?: "Contest") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                        }
                    }
                )
            }
        ) { padding ->
            when {
                state.isLoading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                state.error != null -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(state.error!!, color = MaterialTheme.colorScheme.error)
                    }
                }
                state.contest != null -> {
                    val contest = state.contest!!
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxSize().padding(padding)
                    ) {
                        // Prize section
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(20.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("Prize Pool", style = MaterialTheme.typography.labelMedium)
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        KrCurrencyFormatter.formatKr(contest.prizeKr),
                                        fontSize = 28.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Text(
                                        "Platform fee: ${KrCurrencyFormatter.formatKr(contest.platformFeeKr)} (15%)",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.6f)
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                                        StatItem("Participants", "${contest.participantsCount}")
                                        StatItem("Submissions", "${contest.submissionsCount}")
                                        StatItem("Max Winners", "${contest.maxWinners}")
                                    }
                                }
                            }
                        }

                        // Sponsor section — "Sponsored by [NAME]" with clickable name
                        if (!contest.sponsorName.isNullOrBlank()) {
                            item {
                                val annotatedText = buildAnnotatedString {
                                    append("Sponsored by ")
                                    withStyle(
                                        SpanStyle(
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.Bold,
                                            textDecoration = if (contest.sponsorUrl != null) TextDecoration.Underline else TextDecoration.None
                                        )
                                    ) {
                                        append(contest.sponsorName)
                                    }
                                }
                                Text(
                                    text = annotatedText,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable(enabled = !contest.sponsorUrl.isNullOrBlank()) {
                                            contest.sponsorUrl?.let { uriHandler.openUri(it) }
                                        },
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }

                        // Description + rules
                        item {
                            Column {
                                Text("About", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                Text(contest.description, style = MaterialTheme.typography.bodyMedium)

                                if (contest.rules.isNotEmpty()) {
                                    Spacer(Modifier.height(12.dp))
                                    Text("Rules", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    Spacer(Modifier.height(6.dp))
                                    contest.rules.forEachIndexed { i, rule ->
                                        Text(
                                            "${i + 1}. $rule",
                                            style = MaterialTheme.typography.bodySmall,
                                            modifier = Modifier.padding(bottom = 4.dp)
                                        )
                                    }
                                }
                            }
                        }

                        // Join button (only for ACTIVE contests not yet joined)
                        if (contest.status == ContestStatus.ACTIVE && !state.hasJoined) {
                            item {
                                Button(
                                    onClick = { viewModel.joinContest() },
                                    modifier = Modifier.fillMaxWidth().height(52.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    enabled = !state.isJoining
                                ) {
                                    if (state.isJoining) {
                                        CircularProgressIndicator(
                                            color = MaterialTheme.colorScheme.onPrimary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    } else {
                                        Text("Join Contest", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    }
                                }
                            }
                        }

                        if (state.hasJoined && contest.status == ContestStatus.ACTIVE) {
                            item {
                                OutlinedButton(
                                    onClick = { /* Navigate to submission screen */ },
                                    modifier = Modifier.fillMaxWidth().height(52.dp),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Submit Your Entry", fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        // Submissions header
                        item {
                            Text(
                                "All Submissions (${state.submissions.size})",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }

                        // Submissions list — always visible per spec
                        if (state.submissions.isEmpty()) {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("No submissions yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        } else {
                            items(state.submissions, key = { it.id }) { submission ->
                                SubmissionItem(submission)
                            }

                            if (state.nextSubmissionCursor != null) {
                                item {
                                    TextButton(
                                        onClick = { viewModel.loadMoreSubmissions() },
                                        modifier = Modifier.fillMaxWidth()
                                    ) { Text("Load more") }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun StatItem(label: String, value: String) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f))
        }
    }

    @Composable
    private fun SubmissionItem(submission: ContestSubmission) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("@${submission.user.username}", fontWeight = FontWeight.SemiBold)
                    Text(submission.user.displayName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                submission.rank?.let {
                    Text(
                        "#$it",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 16.sp
                    )
                }
            }
        }
    }
}

