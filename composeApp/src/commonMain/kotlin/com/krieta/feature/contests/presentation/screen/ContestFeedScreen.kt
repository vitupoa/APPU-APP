package com.krieta.feature.contests.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.model.ContestStatus
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.feature.contests.presentation.viewmodel.ContestFeedState
import com.krieta.feature.contests.presentation.viewmodel.ContestFeedViewModel
import org.koin.compose.koinInject
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add

class ContestFeedScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ContestFeedViewModel>()
        val state by viewModel.state.collectAsState()
        val isLoadingMore by viewModel.isLoadingMore.collectAsState()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val exchangeRate by currencyProvider.exchangeRate.collectAsState()
        val listState = rememberLazyListState()

        // Load more when reaching end
        val shouldLoadMore by remember {
            derivedStateOf {
                val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
                val total = listState.layoutInfo.totalItemsCount
                lastVisible >= total - 3
            }
        }

        LaunchedEffect(shouldLoadMore) {
            if (shouldLoadMore) viewModel.loadMore()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Contests", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    actions = {
                        TextButton(onClick = { navigator.push(CreateContestScreen()) }) {
                            Text("Create", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                )
            }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                // Filter chips
                val filters = listOf(null to "All", "ACTIVE" to "Active", "COMPLETED" to "Completed")
                val activeFilter = (state as? ContestFeedState.Success)?.activeFilter

                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filters) { (key, label) ->
                        FilterChip(
                            selected = activeFilter == key,
                            onClick = { viewModel.applyFilter(key) },
                            label = { Text(label) }
                        )
                    }
                }

                when (val currentState = state) {
                    is ContestFeedState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is ContestFeedState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(currentState.message, color = MaterialTheme.colorScheme.error)
                                Spacer(Modifier.height(8.dp))
                                Button(onClick = { viewModel.refresh() }) { Text("Retry") }
                            }
                        }
                    }
                    is ContestFeedState.Success -> {
                        if (currentState.items.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text("No contests yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        } else {
                            LazyColumn(
                                state = listState,
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(currentState.items, key = { it.id }) { contest ->
                                    ContestCard(
                                        contest = contest,
                                        currencyProvider = currencyProvider,
                                        onClick = { navigator.push(ContestDetailScreen(contest.id)) }
                                    )
                                }
                                if (isLoadingMore) {
                                    item {
                                        Box(
                                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                                            contentAlignment = Alignment.Center
                                        ) { CircularProgressIndicator(modifier = Modifier.size(24.dp)) }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun ContestCard(contest: Contest, currencyProvider: UserCurrencyProvider, onClick: () -> Unit) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Status badge
                val (badgeColor, badgeText) = when (contest.status) {
                    ContestStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer to "🟢 Active"
                    ContestStatus.JUDGING -> MaterialTheme.colorScheme.tertiaryContainer to "⚖️ Judging"
                    ContestStatus.COMPLETED -> MaterialTheme.colorScheme.surfaceVariant to "✅ Completed"
                    else -> MaterialTheme.colorScheme.surfaceVariant to contest.status.name
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = badgeColor
                    ) {
                        Text(
                            badgeText,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    Text(
                        contest.contestCategory.name,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(Modifier.height(10.dp))

                Text(contest.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(Modifier.height(4.dp))
                com.krieta.com.core.ui.components.HashtagMentionText(
                    text = contest.description,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = MaterialTheme.typography.bodySmall.fontSize,
                    maxLines = 2
                )

                Spacer(Modifier.height(12.dp))

                // Prize + stats row
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("Prize Pool", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(
                            currencyProvider.formatWithFiat(contest.prizeKr),
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Participants", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("${contest.participantsCount}", fontWeight = FontWeight.SemiBold)
                    }
                }

                if (contest.isJoined) {
                    Spacer(Modifier.height(8.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = MaterialTheme.colorScheme.secondaryContainer
                    ) {
                        Text(
                            "✓ Joined",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }
        }
    }
}

