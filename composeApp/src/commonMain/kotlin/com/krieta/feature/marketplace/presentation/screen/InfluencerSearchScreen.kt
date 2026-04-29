package com.krieta.feature.marketplace.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.krieta.feature.marketplace.domain.model.InfluencerProfile
import com.krieta.feature.marketplace.domain.model.InfluencerTier
import com.krieta.feature.marketplace.presentation.viewmodel.InfluencerSearchState
import com.krieta.feature.marketplace.presentation.viewmodel.InfluencerSearchViewModel
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InfluencerSearchScreen(
    viewModel: InfluencerSearchViewModel = koinInject(),
    onInfluencerClick: (String) -> Unit
) {
    var selectedTier by remember { mutableStateOf<InfluencerTier?>(null) }
    var showFilters by remember { mutableStateOf(false) }
    var minFollowers by remember { mutableStateOf("") }
    var minSubscribers by remember { mutableStateOf("") }
    var selectedPlatform by remember { mutableStateOf<String?>(null) }
    
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.searchInfluencers()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Find Creators") },
                actions = {
                    IconButton(onClick = { showFilters = !showFilters }) {
                        Icon(painterResource(Res.drawable.ic_filter_list), "Filters")
                    }
                }
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            if (showFilters) {
                FilterSection(
                    selectedTier = selectedTier,
                    onTierSelected = { 
                        selectedTier = it
                    },
                    minFollowers = minFollowers,
                    onMinFollowersChange = { minFollowers = it },
                    minSubscribers = minSubscribers,
                    onMinSubscribersChange = { minSubscribers = it },
                    selectedPlatform = selectedPlatform,
                    onPlatformSelected = { selectedPlatform = it },
                    onApplyFilters = {
                        viewModel.searchInfluencers(
                            tier = selectedTier,
                            minFollowers = minFollowers.toIntOrNull(),
                            minSubscribers = minSubscribers.toIntOrNull(),
                            platform = selectedPlatform
                        )
                    }
                )
            }
            
            when (val state = uiState) {
                is InfluencerSearchState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is InfluencerSearchState.Success -> {
                    LazyColumn(Modifier.fillMaxSize()) {
                        items(state.influencers) { influencer ->
                            InfluencerCard(
                                influencer = influencer,
                                socialAccounts = state.socialAccountsMap[influencer.userId] ?: emptyList(),
                                onClick = { onInfluencerClick(influencer.userId) }
                            )
                        }
                    }
                }
                is InfluencerSearchState.Error -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}

@Composable
fun FilterSection(
    selectedTier: InfluencerTier?,
    onTierSelected: (InfluencerTier?) -> Unit,
    minFollowers: String,
    onMinFollowersChange: (String) -> Unit,
    minSubscribers: String,
    onMinSubscribersChange: (String) -> Unit,
    selectedPlatform: String?,
    onPlatformSelected: (String?) -> Unit,
    onApplyFilters: () -> Unit
) {
    Card(Modifier.fillMaxWidth().padding(16.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Filter by Tier", style = MaterialTheme.typography.titleMedium)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                InfluencerTier.entries.forEach { tier ->
                    FilterChip(
                        selected = selectedTier == tier,
                        onClick = { onTierSelected(if (selectedTier == tier) null else tier) },
                        label = { Text(tier.name) }
                    )
                }
            }
            
            Divider()
            
            Text("Social Media Filters", style = MaterialTheme.typography.titleMedium)
            
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = minFollowers,
                    onValueChange = onMinFollowersChange,
                    label = { Text("Min Followers") },
                    placeholder = { Text("e.g. 10000") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = minSubscribers,
                    onValueChange = onMinSubscribersChange,
                    label = { Text("Min Subscribers") },
                    placeholder = { Text("e.g. 2000") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }
            
            Text("Platform", style = MaterialTheme.typography.bodyMedium)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("TikTok", "YouTube", "Instagram").forEach { platform ->
                    FilterChip(
                        selected = selectedPlatform == platform,
                        onClick = { onPlatformSelected(if (selectedPlatform == platform) null else platform) },
                        label = { Text(platform) }
                    )
                }
            }
            
            Button(
                onClick = onApplyFilters,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Apply Filters")
            }
        }
    }
}

@Composable
fun InfluencerCard(
    influencer: InfluencerProfile,
    socialAccounts: List<com.krieta.feature.marketplace.domain.model.SocialMediaAccount>,
    onClick: () -> Unit
) {
    Card(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).clickable(onClick = onClick)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(influencer.username, style = MaterialTheme.typography.titleMedium)
                        if (influencer.isVerified) {
                            Icon(
                                painterResource(Res.drawable.ic_verified),
                                "Verified",
                                Modifier.size(16.dp).padding(start = 4.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text("${influencer.tier.name} • ${influencer.followersCount} followers", 
                        style = MaterialTheme.typography.bodySmall)
                    Text("${(influencer.engagementRate * 100).toInt()}% engagement • ⭐ ${influencer.rating}",
                        style = MaterialTheme.typography.bodySmall)
                }
                Icon(painterResource(Res.drawable.ic_chevron_right), null)
            }
            
            if (socialAccounts.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Divider()
                Spacer(Modifier.height(8.dp))
                Text("Social Media", style = MaterialTheme.typography.labelSmall)
                Spacer(Modifier.height(4.dp))
                socialAccounts.take(3).forEach { account ->
                    Row(
                        Modifier.fillMaxWidth().padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "${account.platform.name}: @${account.username}",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            "${account.followerCount + account.subscriberCount} ${if (account.subscriberCount > 0) "subs" else "followers"}",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
