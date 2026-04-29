package com.krieta.feature.sponsored.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.sponsored.domain.model.SponsoredAnalytics
import com.krieta.feature.sponsored.domain.model.SponsoredContent
import com.krieta.feature.sponsored.data.remote.SponsoredApi
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

class BrandDashboardScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val api = koinInject<SponsoredApi>()
        val scope = rememberCoroutineScope()
        
        var campaigns by remember { mutableStateOf<List<SponsoredContent>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }
        
        LaunchedEffect(Unit) {
            try {
                campaigns = api.getMyCampaigns()
                isLoading = false
            } catch (e: Exception) {
                isLoading = false
            }
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Sponsored Campaigns", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { navigator.push(CreateCampaignScreen()) }
                ) {
                    Icon(painterResource(Res.drawable.ic_add), "Create Campaign")
                }
            }
        ) { padding ->
            if (isLoading) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (campaigns.isEmpty()) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("No campaigns yet", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = { navigator.push(CreateCampaignScreen()) }) {
                            Text("Create Your First Campaign")
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(campaigns) { campaign ->
                        CampaignCard(
                            campaign = campaign,
                            onToggle = {
                                scope.launch {
                                    try {
                                        api.toggleCampaign(campaign.id)
                                        campaigns = api.getMyCampaigns()
                                    } catch (e: Exception) {}
                                }
                            },
                            onClick = { navigator.push(CampaignAnalyticsScreen(campaign.id)) }
                        )
                    }
                }
            }
        }
    }
    
    @Composable
    private fun CampaignCard(
        campaign: SponsoredContent,
        onToggle: () -> Unit,
        onClick: () -> Unit
    ) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(campaign.campaignName, fontWeight = FontWeight.Bold)
                        Text(
                            campaign.status.name,
                            style = MaterialTheme.typography.bodySmall,
                            color = when (campaign.status.name) {
                                "ACTIVE" -> MaterialTheme.colorScheme.primary
                                "PAUSED" -> MaterialTheme.colorScheme.error
                                "PENDING_REVIEW" -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            }
                        )
                    }
                    
                    if (campaign.status.name == "ACTIVE" || campaign.status.name == "PAUSED") {
                        IconButton(onClick = onToggle) {
                            Icon(
                                if (campaign.status.name == "ACTIVE") painterResource(Res.drawable.ic_pause) else painterResource(Res.drawable.ic_play_arrow),
                                contentDescription = if (campaign.status.name == "ACTIVE") "Pause" else "Resume"
                            )
                        }
                    }
                }
                
                Spacer(Modifier.height(12.dp))
                
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("Budget", style = MaterialTheme.typography.labelSmall)
                        Text("${campaign.budget} KR", fontWeight = FontWeight.SemiBold)
                    }
                    Column {
                        Text("Spent", style = MaterialTheme.typography.labelSmall)
                        Text("${campaign.spent} KR", fontWeight = FontWeight.SemiBold)
                    }
                    Column {
                        Text("Impressions", style = MaterialTheme.typography.labelSmall)
                        Text("${campaign.impressions}", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
