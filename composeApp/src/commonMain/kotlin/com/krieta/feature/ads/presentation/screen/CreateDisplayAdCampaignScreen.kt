package com.krieta.feature.ads.presentation.screen

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateDisplayAdCampaignScreen(
    onNavigateBack: () -> Unit
) {
    var currentStep by remember { mutableStateOf(0) }
    val steps = listOf("Basic Info", "Creative", "Audience", "Placements", "Budget", "Review")
    
    var campaignName by remember { mutableStateOf("") }
    var objective by remember { mutableStateOf("AWARENESS") }
    var adTitle by remember { mutableStateOf("") }
    var adDescription by remember { mutableStateOf("") }
    var ctaText by remember { mutableStateOf("Learn More") }
    var ctaUrl by remember { mutableStateOf("") }
    var selectedPlacements by remember { mutableStateOf(setOf<String>()) }
    var selectedLocations by remember { mutableStateOf(listOf<LocationTarget>()) }
    var budgetType by remember { mutableStateOf("DAILY") }
    var budgetAmount by remember { mutableStateOf("") }
    var targetCpm by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Ad Campaign") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            LinearProgressIndicator(
                progress = { (currentStep + 1) / steps.size.toFloat() },
                modifier = Modifier.fillMaxWidth()
            )
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                steps.forEachIndexed { index, step ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    if (index <= currentStep) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.surfaceVariant
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${index + 1}",
                                color = if (index <= currentStep) Color.White else Color.Gray,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                        Text(
                            text = step,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (index <= currentStep) MaterialTheme.colorScheme.primary else Color.Gray
                        )
                    }
                }
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (currentStep) {
                    0 -> BasicInfoStep(
                        campaignName = campaignName,
                        onCampaignNameChange = { campaignName = it },
                        objective = objective,
                        onObjectiveChange = { objective = it }
                    )
                    1 -> CreativeStep(
                        adTitle = adTitle,
                        onAdTitleChange = { adTitle = it },
                        adDescription = adDescription,
                        onAdDescriptionChange = { adDescription = it },
                        ctaText = ctaText,
                        onCtaTextChange = { ctaText = it },
                        ctaUrl = ctaUrl,
                        onCtaUrlChange = { ctaUrl = it }
                    )
                    2 -> AudienceStep(
                        selectedLocations = selectedLocations,
                        onLocationsChange = { selectedLocations = it }
                    )
                    3 -> PlacementsStep(
                        selectedPlacements = selectedPlacements,
                        onPlacementsChange = { selectedPlacements = it }
                    )
                    4 -> BudgetStep(
                        budgetType = budgetType,
                        onBudgetTypeChange = { budgetType = it },
                        budgetAmount = budgetAmount,
                        onBudgetAmountChange = { budgetAmount = it },
                        targetCpm = targetCpm,
                        onTargetCpmChange = { targetCpm = it },
                        selectedLocations = selectedLocations,
                        selectedPlacements = selectedPlacements
                    )
                    5 -> ReviewStep(
                        campaignName = campaignName,
                        objective = objective,
                        adTitle = adTitle,
                        selectedPlacements = selectedPlacements,
                        selectedLocations = selectedLocations,
                        budgetType = budgetType,
                        budgetAmount = budgetAmount
                    )
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (currentStep > 0) {
                    OutlinedButton(onClick = { currentStep-- }) {
                        Text("Back")
                    }
                } else {
                    Spacer(Modifier.width(1.dp))
                }

                Button(
                    onClick = {
                        if (currentStep < steps.size - 1) currentStep++
                        else { /* Submit campaign */ }
                    }
                ) {
                    Text(if (currentStep < steps.size - 1) "Next" else "Submit Campaign")
                }
            }
        }
    }
}

@Composable
private fun BasicInfoStep(
    campaignName: String,
    onCampaignNameChange: (String) -> Unit,
    objective: String,
    onObjectiveChange: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Campaign Basic Information", style = MaterialTheme.typography.titleLarge)
        }
        
        item {
            OutlinedTextField(
                value = campaignName,
                onValueChange = onCampaignNameChange,
                label = { Text("Campaign Name") },
                modifier = Modifier.fillMaxWidth()
            )
        }
        
        item {
            Text("Campaign Objective", style = MaterialTheme.typography.titleMedium)
            val objectives = listOf(
                "AWARENESS" to "Brand Awareness",
                "TRAFFIC" to "Drive Traffic",
                "CONVERSIONS" to "Conversions",
                "APP_INSTALLS" to "App Installs"
            )
            objectives.forEach { (value, label) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onObjectiveChange(value) }
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = objective == value,
                        onClick = { onObjectiveChange(value) }
                    )
                    Text(label, modifier = Modifier.padding(start = 8.dp))
                }
            }
        }
    }
}

@Composable
private fun CreativeStep(
    adTitle: String,
    onAdTitleChange: (String) -> Unit,
    adDescription: String,
    onAdDescriptionChange: (String) -> Unit,
    ctaText: String,
    onCtaTextChange: (String) -> Unit,
    ctaUrl: String,
    onCtaUrlChange: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Ad Creative", style = MaterialTheme.typography.titleLarge)
        }
        
        item {
            OutlinedTextField(
                value = adTitle,
                onValueChange = onAdTitleChange,
                label = { Text("Ad Title") },
                modifier = Modifier.fillMaxWidth()
            )
        }
        
        item {
            OutlinedTextField(
                value = adDescription,
                onValueChange = onAdDescriptionChange,
                label = { Text("Ad Description") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )
        }
        
        item {
            Button(
                onClick = { /* Upload image */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Add, null)
                Spacer(Modifier.width(8.dp))
                Text("Upload Ad Image")
            }
        }
        
        item {
            OutlinedTextField(
                value = ctaText,
                onValueChange = onCtaTextChange,
                label = { Text("Call-to-Action Text") },
                modifier = Modifier.fillMaxWidth()
            )
        }
        
        item {
            OutlinedTextField(
                value = ctaUrl,
                onValueChange = onCtaUrlChange,
                label = { Text("Destination URL") },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun AudienceStep(
    selectedLocations: List<LocationTarget>,
    onLocationsChange: (List<LocationTarget>) -> Unit
) {
    var showLocationPicker by remember { mutableStateOf(false) }
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Target Audience", style = MaterialTheme.typography.titleLarge)
        }
        
        item {
            Text("Location Targeting", style = MaterialTheme.typography.titleMedium)
            Button(
                onClick = { showLocationPicker = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.LocationOn, null)
                Spacer(Modifier.width(8.dp))
                Text("Add Locations")
            }
        }
        
        items(selectedLocations) { location ->
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(location.displayName, fontWeight = FontWeight.Bold)
                        Text(location.scope, style = MaterialTheme.typography.bodySmall)
                    }
                    IconButton(onClick = {
                        onLocationsChange(selectedLocations - location)
                    }) {
                        Icon(Icons.Default.Close, "Remove")
                    }
                }
            }
        }
    }
    
    if (showLocationPicker) {
        LocationPickerDialog(
            onDismiss = { showLocationPicker = false },
            onLocationSelected = { location ->
                onLocationsChange(selectedLocations + location)
                showLocationPicker = false
            }
        )
    }
}

@Composable
private fun PlacementsStep(
    selectedPlacements: Set<String>,
    onPlacementsChange: (Set<String>) -> Unit
) {
    val placements = listOf(
        "LIVE_STREAMS" to "Live Streams",
        "CONTESTS" to "Contest Submissions",
        "DISCOVER_SHORTS" to "Discover Shorts",
        "ADMIRING_SHORTS" to "Admiring Shorts",
        "DRIPS_FEED" to "Drips Feed",
        "STORIES" to "Stories",
        "GROUP_CHATS" to "Group Chats",
        "CHAMA_CHATS" to "Chama Chats"
    )
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Ad Placements", style = MaterialTheme.typography.titleLarge)
            Text("Select where your ads will appear", style = MaterialTheme.typography.bodyMedium)
        }
        
        items(placements) { (value, label) ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        onPlacementsChange(
                            if (selectedPlacements.contains(value)) selectedPlacements - value
                            else selectedPlacements + value
                        )
                    }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = selectedPlacements.contains(value),
                        onCheckedChange = null
                    )
                    Text(label, modifier = Modifier.padding(start = 8.dp))
                }
            }
        }
    }
}

@Composable
private fun BudgetStep(
    budgetType: String,
    onBudgetTypeChange: (String) -> Unit,
    budgetAmount: String,
    onBudgetAmountChange: (String) -> Unit,
    targetCpm: String,
    onTargetCpmChange: (String) -> Unit,
    selectedLocations: List<LocationTarget>,
    selectedPlacements: Set<String>
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Budget & Bidding", style = MaterialTheme.typography.titleLarge)
        }
        
        item {
            Text("Budget Type", style = MaterialTheme.typography.titleMedium)
            Row {
                FilterChip(
                    selected = budgetType == "DAILY",
                    onClick = { onBudgetTypeChange("DAILY") },
                    label = { Text("Daily Budget") }
                )
                Spacer(Modifier.width(8.dp))
                FilterChip(
                    selected = budgetType == "LIFETIME",
                    onClick = { onBudgetTypeChange("LIFETIME") },
                    label = { Text("Lifetime Budget") }
                )
            }
        }
        
        item {
            OutlinedTextField(
                value = budgetAmount,
                onValueChange = onBudgetAmountChange,
                label = { Text("Budget Amount (KES)") },
                modifier = Modifier.fillMaxWidth(),
                prefix = { Text("KES ") }
            )
            Text(
                "Minimum: KES 1,000",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        
        item {
            Text("Bidding Strategy", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = targetCpm,
                onValueChange = onTargetCpmChange,
                label = { Text("Target CPM (KES)") },
                modifier = Modifier.fillMaxWidth(),
                prefix = { Text("KES ") }
            )
            Text(
                "Recommended: KES 40-150 based on targeting",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Estimated Results", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text("Daily Reach: 5,000 - 8,000 people")
                    Text("Estimated Impressions: 15,000 - 25,000")
                }
            }
        }
    }
}

@Composable
private fun ReviewStep(
    campaignName: String,
    objective: String,
    adTitle: String,
    selectedPlacements: Set<String>,
    selectedLocations: List<LocationTarget>,
    budgetType: String,
    budgetAmount: String
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Review Campaign", style = MaterialTheme.typography.titleLarge)
        }
        
        item {
            ReviewSection("Campaign Name", campaignName)
        }
        
        item {
            ReviewSection("Objective", objective)
        }
        
        item {
            ReviewSection("Ad Title", adTitle)
        }
        
        item {
            ReviewSection("Placements", "${selectedPlacements.size} selected")
        }
        
        item {
            ReviewSection("Locations", "${selectedLocations.size} selected")
        }
        
        item {
            ReviewSection("Budget", "$budgetType: KES $budgetAmount")
        }
        
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.tertiaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Campaign will be reviewed within 24 hours", fontWeight = FontWeight.Bold)
                    Text("You'll be notified once approved", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun ReviewSection(label: String, value: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = Color.Gray)
            Text(value, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@Composable
private fun LocationPickerDialog(
    onDismiss: () -> Unit,
    onLocationSelected: (LocationTarget) -> Unit
) {
    var selectedScope by remember { mutableStateOf("COUNTRY") }
    var searchQuery by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Location") },
        text = {
            Column {
                ScrollableTabRow(selectedTabIndex = 0) {
                    listOf("Country", "City", "Region").forEach { scope ->
                        Tab(
                            selected = selectedScope == scope.uppercase(),
                            onClick = { selectedScope = scope.uppercase() },
                            text = { Text(scope) }
                        )
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = { Text("Search location") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(Modifier.height(16.dp))
                
                LazyColumn {
                    items(5) { index ->
                        TextButton(
                            onClick = {
                                onLocationSelected(
                                    LocationTarget(
                                        scope = selectedScope,
                                        scopeValue = "KE_$index",
                                        displayName = "Location $index"
                                    )
                                )
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Sample Location $index")
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

data class LocationTarget(
    val scope: String,
    val scopeValue: String,
    val displayName: String
)
