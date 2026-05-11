package com.krieta.feature.marketplace.presentation.screen
import com.krieta.com.core.util.SafeConversion
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
import androidx.compose.ui.unit.dp
import com.krieta.feature.marketplace.domain.model.BrandCampaign
import com.krieta.feature.marketplace.domain.model.InfluencerTier
import com.krieta.feature.marketplace.presentation.viewmodel.*
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CampaignListScreen(
    viewModel: CampaignListViewModel = koinInject(),
    onCreateClick: () -> Unit,
    onCampaignClick: (String) -> Unit,
    isBrandView: Boolean = true
) {
    val campaigns = if (isBrandView) viewModel.myCampaigns.collectAsState().value 
                    else viewModel.availableCampaigns.collectAsState().value
    val isLoading by viewModel.isLoading.collectAsState()
    
    LaunchedEffect(Unit) {
        if (isBrandView) viewModel.loadMyCampaigns()
        else viewModel.loadAvailableCampaigns()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isBrandView) "My Campaigns" else "Available Campaigns") }
            )
        },
        floatingActionButton = {
            if (isBrandView) {
                FloatingActionButton(onClick = onCreateClick) {
                    Icon(painterResource(Res.drawable.ic_add), "Create Campaign")
                }
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(Modifier.fillMaxSize().padding(padding)) {
                items(campaigns) { campaign ->
                    CampaignCard(campaign, onClick = { onCampaignClick(campaign.id) })
                }
            }
        }
    }
}

@Composable
fun CampaignCard(campaign: BrandCampaign, onClick: () -> Unit) {
    Card(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).clickable(onClick = onClick)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(campaign.title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                StatusChip(campaign.status.name)
            }
            Spacer(Modifier.height(8.dp))
            Text(campaign.description, style = MaterialTheme.typography.bodyMedium, maxLines = 2)
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Budget: $${campaign.budget}", style = MaterialTheme.typography.bodySmall)
                Text("${campaign.applicationsCount} applications", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
fun StatusChip(status: String) {
    Surface(
        color = when (status) {
            "ACTIVE" -> MaterialTheme.colorScheme.primary
            "COMPLETED" -> MaterialTheme.colorScheme.tertiary
            else -> MaterialTheme.colorScheme.secondary
        },
        shape = MaterialTheme.shapes.small
    ) {
        Text(status, Modifier.padding(horizontal = 8.dp, vertical = 4.dp), 
            style = MaterialTheme.typography.labelSmall)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateCampaignScreen(
    viewModel: CreateCampaignViewModel = koinInject(),
    onSuccess: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var budget by remember { mutableStateOf("") }
    var requirements by remember { mutableStateOf("") }
    var deliverables by remember { mutableStateOf("") }
    var selectedTier by remember { mutableStateOf<InfluencerTier?>(null) }
    
    val createState by viewModel.createState.collectAsState()
    
    LaunchedEffect(createState) {
        if (createState is CreateCampaignState.Success) {
            onSuccess()
        }
    }
    
    Scaffold(
        topBar = { TopAppBar(title = { Text("Create Campaign") }) }
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Campaign Title") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            item {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
            }
            
            item {
                OutlinedTextField(
                    value = budget,
                    onValueChange = { budget = it },
                    label = { Text("Budget ($)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            item {
                Text("Target Influencer Tier", style = MaterialTheme.typography.titleSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = selectedTier == null,
                        onClick = { selectedTier = null },
                        label = { Text("ALL") }
                    )
                    InfluencerTier.entries.forEach { tier ->
                        FilterChip(
                            selected = selectedTier == tier,
                            onClick = { selectedTier = tier },
                            label = { Text(tier.name) }
                        )
                    }
                }
            }
            
            item {
                OutlinedTextField(
                    value = requirements,
                    onValueChange = { requirements = it },
                    label = { Text("Requirements") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
            }
            
            item {
                OutlinedTextField(
                    value = deliverables,
                    onValueChange = { deliverables = it },
                    label = { Text("Deliverables") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
            }
            
            item {
                    Button(
                        onClick = {
                            val now = kotlinx.datetime.Clock.System.now()
                            val startDate = now.toString()
                            val endDate = now.plus(kotlin.time.Duration.parse("P30D")).toString()
                            
                            viewModel.createCampaign(
                                title, description, SafeConversion.toDoubleOrDefaultWithValidation(budget, "campaignBudget", 0.0, defaultValue = 0.0),
                                selectedTier, emptyList(), requirements, deliverables,
                                startDate, endDate
                            )
                        },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = createState !is CreateCampaignState.Loading
                ) {
                    if (createState is CreateCampaignState.Loading) {
                        CircularProgressIndicator(Modifier.size(24.dp))
                    } else {
                        Text("Create Campaign")
                    }
                }
            }
            
            if (createState is CreateCampaignState.Error) {
                item {
                    Text(
                        (createState as CreateCampaignState.Error).message,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
