package com.krieta.feature.sponsored.presentation.screen

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.sponsored.domain.model.SponsoredContent
import com.krieta.feature.sponsored.data.remote.SponsoredApi
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

class AdminSponsoredApprovalScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val api = koinInject<SponsoredApi>()
        val scope = rememberCoroutineScope()
        
        var pendingCampaigns by remember { mutableStateOf<List<SponsoredContent>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }
        
        fun loadPendingCampaigns() {
            scope.launch {
                try {
                    pendingCampaigns = api.getPendingCampaigns()
                    isLoading = false
                } catch (e: Exception) {
                    isLoading = false
                }
            }
        }
        
        LaunchedEffect(Unit) {
            loadPendingCampaigns()
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Approve Campaigns", fontWeight = FontWeight.Bold) },
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
            } else if (pendingCampaigns.isEmpty()) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text("No pending campaigns", style = MaterialTheme.typography.titleMedium)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(pendingCampaigns) { campaign ->
                        PendingCampaignCard(
                            campaign = campaign,
                            onApprove = {
                                scope.launch {
                                    try {
                                        api.approveCampaign(campaign.id)
                                        loadPendingCampaigns()
                                    } catch (e: Exception) {}
                                }
                            },
                            onReject = {
                                scope.launch {
                                    try {
                                        api.rejectCampaign(campaign.id)
                                        loadPendingCampaigns()
                                    } catch (e: Exception) {}
                                }
                            }
                        )
                    }
                }
            }
        }
    }
    
    @Composable
    private fun PendingCampaignCard(
        campaign: SponsoredContent,
        onApprove: () -> Unit,
        onReject: () -> Unit
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(campaign.campaignName, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("Type", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(campaign.contentType.name, fontWeight = FontWeight.SemiBold)
                    }
                    Column {
                        Text("Budget", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("${campaign.budget} KR", fontWeight = FontWeight.SemiBold)
                    }
                    Column {
                        Text("Model", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(campaign.pricingModel.name, fontWeight = FontWeight.SemiBold)
                    }
                }
                
                Spacer(Modifier.height(12.dp))
                
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = onApprove,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Icon(painterResource(Res.drawable.ic_check), "Approve", modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Approve")
                    }
                    
                    OutlinedButton(
                        onClick = onReject,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(painterResource(Res.drawable.ic_close), "Reject", modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Reject")
                    }
                }
            }
        }
    }
}
