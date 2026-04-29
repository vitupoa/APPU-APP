package com.krieta.feature.sponsored.presentation.screen
import com.krieta.com.core.util.formatString
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll

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
import com.krieta.feature.sponsored.data.remote.SponsoredApi
import org.koin.compose.koinInject

class CampaignAnalyticsScreen(private val campaignId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val api = koinInject<SponsoredApi>()
        
        var analytics by remember { mutableStateOf<SponsoredAnalytics?>(null) }
        var isLoading by remember { mutableStateOf(true) }
        
        LaunchedEffect(campaignId) {
            try {
                analytics = api.getCampaignAnalytics(campaignId)
                isLoading = false
            } catch (e: Exception) {
                isLoading = false
            }
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Campaign Analytics", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
                )
            }
        ) { padding ->
            if (isLoading) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (analytics == null) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text("Failed to load analytics")
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text(analytics!!.campaignName, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                            Spacer(Modifier.height(4.dp))
                            Text(analytics!!.status.name, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        MetricCard("Budget", "${analytics!!.budget} KR", Modifier.weight(1f))
                        MetricCard("Spent", "${analytics!!.spent} KR", Modifier.weight(1f))
                    }
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        MetricCard("Impressions", "${analytics!!.impressions}", Modifier.weight(1f))
                        MetricCard("Views", "${analytics!!.views}", Modifier.weight(1f))
                    }
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        MetricCard("Engagements", "${analytics!!.engagements}", Modifier.weight(1f))
                        MetricCard("Clicks", "${analytics!!.clicks}", Modifier.weight(1f))
                    }
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        MetricCard("CPM", formatString("%.2f KR", analytics!!.cpm), Modifier.weight(1f))
                        MetricCard("CTR", formatString("%.2f%%", analytics!!.ctr), Modifier.weight(1f))
                    }
                    
                    MetricCard("Engagement Rate", formatString("%.2f%%", analytics!!.engagementRate), Modifier.fillMaxWidth())
                }
            }
        }
    }
    
    @Composable
    private fun MetricCard(label: String, value: String, modifier: Modifier = Modifier) {
        Card(
            modifier = modifier,
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(4.dp))
                Text(value, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
            }
        }
    }
}

