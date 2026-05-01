package com.krieta.feature.admin.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.admin.domain.model.*
import com.krieta.feature.admin.presentation.viewmodel.AdManagementViewModel
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

/**
 * Super Admin Ad Management Dashboard
 * - Control ad pricing (CPM ranges)
 * - Control ad placement (frequency)
 * - Create/approve/reject ads
 * - Adjust platform cut percentage
 * - View analytics
 * 
 * ROLE-BASED ACCESS: Only visible to SUPER_ADMIN role
 */
class AdminAdManagementScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<AdManagementViewModel>()
        val state by viewModel.state.collectAsState()
        val tokenManager = org.koin.compose.koinInject<com.krieta.com.core.security.TokenManager>()
        
        var selectedTab by remember { mutableStateOf(0) }
        val tabs = listOf("Config", "Campaigns", "Sponsored Posts", "Analytics")
        var userRole by remember { mutableStateOf<String?>(null) }
        
        // Check user role on launch
        LaunchedEffect(Unit) {
            userRole = tokenManager.getAdminRole()
        }
        
        // Only SUPER_ADMIN can access this screen
        if (userRole != "SUPER_ADMIN") {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        Icons.Default.Lock,
                        contentDescription = "Access Denied",
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                    Text(
                        "Access Denied",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Only Super Admins can access Ad Management",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Button(onClick = { navigator.pop() }) {
                        Text("Go Back")
                    }
                }
            }
            return
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Ad Management", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // Tabs
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = KrietaColors.BackgroundElevated
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(title) }
                        )
                    }
                }

                // Content
                when (selectedTab) {
                    0 -> AdConfigTab(viewModel, state)
                    1 -> CampaignsTab(viewModel, state)
                    2 -> SponsoredPostsTab(viewModel, state)
                    3 -> AnalyticsTab(viewModel, state)
                }
            }
        }
    }
}

@Composable
private fun AdConfigTab(viewModel: AdManagementViewModel, state: AdManagementViewModel.State) {
    var showEditDialog by remember { mutableStateOf(false) }
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = KrietaColors.PrimaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Platform Revenue Split",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(onClick = { showEditDialog = true }) {
                            Icon(Icons.Default.Edit, "Edit")
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Platform: ${state.adConfig?.platformCutPercentage ?: 15.0}%",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.Primary
                    )
                    Text(
                        "Creator: ${100 - (state.adConfig?.platformCutPercentage ?: 15.0)}%",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF43A047)
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Example: KES 10,000 sponsored post → Platform KES ${(state.adConfig?.platformCutPercentage ?: 15.0) * 100}, Creator KES ${(100 - (state.adConfig?.platformCutPercentage ?: 15.0)) * 100}",
                        style = MaterialTheme.typography.bodySmall,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }
            }
        }

        item {
            Text(
                "Ad Pricing (CPM)",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            PricingCard(
                title = "Native Feed Ads",
                emoji = "📱",
                minCpm = state.adConfig?.nativeAdCpmMin ?: 40.0,
                maxCpm = state.adConfig?.nativeAdCpmMax ?: 150.0,
                onEdit = { viewModel.updateNativeAdPricing(it.first, it.second) }
            )
        }

        item {
            PricingCard(
                title = "Banner Ads",
                emoji = "🎯",
                minCpm = state.adConfig?.bannerAdCpmMin ?: 30.0,
                maxCpm = state.adConfig?.bannerAdCpmMax ?: 100.0,
                onEdit = { viewModel.updateBannerAdPricing(it.first, it.second) }
            )
        }

        item {
            PricingCard(
                title = "Story-Style Ads",
                emoji = "🎬",
                minCpm = state.adConfig?.storyAdCpmMin ?: 80.0,
                maxCpm = state.adConfig?.storyAdCpmMax ?: 200.0,
                onEdit = { viewModel.updateStoryAdPricing(it.first, it.second) }
            )
        }

        item {
            Text(
                "Ad Placement Frequency",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            FrequencyCard(
                title = "Native Feed Ads",
                frequency = state.adConfig?.nativeAdFrequency ?: 6,
                description = "Show every N posts",
                onEdit = { viewModel.updateNativeAdFrequency(it) }
            )
        }

        item {
            FrequencyCard(
                title = "Banner Ads",
                frequency = state.adConfig?.bannerAdFrequency ?: 15,
                description = "Show every N posts",
                onEdit = { viewModel.updateBannerAdFrequency(it) }
            )
        }

        item {
            FrequencyCard(
                title = "Story-Style Ads",
                frequency = state.adConfig?.storyAdFrequency ?: 20,
                description = "Show every N posts",
                onEdit = { viewModel.updateStoryAdFrequency(it) }
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = KrietaColors.SurfaceVariant
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Max Ad Load",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "${state.adConfig?.maxAdLoadPercentage ?: 20.0}% of feed",
                            style = MaterialTheme.typography.bodyMedium,
                            color = KrietaColors.OnSurfaceVariant
                        )
                    }
                    Switch(
                        checked = state.adConfig?.isEnabled ?: true,
                        onCheckedChange = { viewModel.toggleAds(it) }
                    )
                }
            }
        }
    }

    if (showEditDialog) {
        EditPlatformCutDialog(
            currentCut = state.adConfig?.platformCutPercentage ?: 15.0,
            onDismiss = { showEditDialog = false },
            onConfirm = { newCut ->
                viewModel.updatePlatformCut(newCut)
                showEditDialog = false
            }
        )
    }
}

@Composable
private fun PricingCard(
    title: String,
    emoji: String,
    minCpm: Double,
    maxCpm: Double,
    onEdit: (Pair<Double, Double>) -> Unit
) {
    var showEditDialog by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.SurfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { showEditDialog = true }
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(emoji, fontSize = 32.sp)
                Column {
                    Text(
                        title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "KES $minCpm - $maxCpm CPM",
                        style = MaterialTheme.typography.bodyMedium,
                        color = KrietaColors.Primary
                    )
                }
            }
            Icon(Icons.Default.Edit, "Edit", tint = KrietaColors.OnSurfaceVariant)
        }
    }

    if (showEditDialog) {
        EditPricingDialog(
            title = title,
            currentMin = minCpm,
            currentMax = maxCpm,
            onDismiss = { showEditDialog = false },
            onConfirm = { min, max ->
                onEdit(Pair(min, max))
                showEditDialog = false
            }
        )
    }
}

@Composable
private fun FrequencyCard(
    title: String,
    frequency: Int,
    description: String,
    onEdit: (Int) -> Unit
) {
    var showEditDialog by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.SurfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { showEditDialog = true }
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Every $frequency posts • $description",
                    style = MaterialTheme.typography.bodyMedium,
                    color = KrietaColors.OnSurfaceVariant
                )
            }
            Icon(Icons.Default.Edit, "Edit", tint = KrietaColors.OnSurfaceVariant)
        }
    }

    if (showEditDialog) {
        EditFrequencyDialog(
            title = title,
            currentFrequency = frequency,
            onDismiss = { showEditDialog = false },
            onConfirm = { newFrequency ->
                onEdit(newFrequency)
                showEditDialog = false
            }
        )
    }
}

@Composable
private fun CampaignsTab(viewModel: AdManagementViewModel, state: AdManagementViewModel.State) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Ad Campaigns",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Button(onClick = { /* Create new campaign */ }) {
                    Icon(Icons.Default.Add, "Add")
                    Spacer(Modifier.width(8.dp))
                    Text("Create Ad")
                }
            }
        }

        items(state.campaigns) { campaign ->
            CampaignCard(campaign, viewModel)
        }
    }
}

@Composable
private fun CampaignCard(campaign: AdCampaign, viewModel: AdManagementViewModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.SurfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        campaign.campaignName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        campaign.advertiserName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }
                StatusChip(campaign.status)
            }

            Spacer(Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                MetricItem("Impressions", campaign.impressions.toString())
                MetricItem("Clicks", campaign.clicks.toString())
                MetricItem("CTR", "${String.format("%.2f", campaign.ctr)}%")
                MetricItem("Spent", "KES ${campaign.spent.toInt()}")
            }

            if (campaign.status == AdStatus.PENDING_APPROVAL) {
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { viewModel.rejectCampaign(campaign.id, "Rejected by admin") },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Reject")
                    }
                    Button(
                        onClick = { viewModel.approveCampaign(campaign.id) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Approve")
                    }
                }
            }
        }
    }
}

@Composable
private fun SponsoredPostsTab(viewModel: AdManagementViewModel, state: AdManagementViewModel.State) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Sponsored Posts",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        items(state.sponsoredPosts) { post ->
            SponsoredPostCard(post, viewModel, state.adConfig?.platformCutPercentage ?: 15.0)
        }
    }
}

@Composable
private fun SponsoredPostCard(
    post: SponsoredPostRequest,
    viewModel: AdManagementViewModel,
    platformCut: Double
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.SurfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        post.brandName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Post ID: ${post.postId.take(8)}...",
                        style = MaterialTheme.typography.bodySmall,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }
                StatusChip(
                    when (post.status) {
                        SponsoredPostStatus.PENDING -> AdStatus.PENDING_APPROVAL
                        SponsoredPostStatus.ACCEPTED -> AdStatus.APPROVED
                        SponsoredPostStatus.POSTED -> AdStatus.ACTIVE
                        SponsoredPostStatus.COMPLETED -> AdStatus.COMPLETED
                        else -> AdStatus.REJECTED
                    }
                )
            }

            Spacer(Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Amount", style = MaterialTheme.typography.bodySmall)
                    Text(
                        "KES ${post.amount.toInt()}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column {
                    Text("Platform ($platformCut%)", style = MaterialTheme.typography.bodySmall)
                    Text(
                        "KES ${post.platformCut.toInt()}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.Primary
                    )
                }
                Column {
                    Text("Creator (${100 - platformCut}%)", style = MaterialTheme.typography.bodySmall)
                    Text(
                        "KES ${post.creatorEarnings.toInt()}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF43A047)
                    )
                }
            }
        }
    }
}

@Composable
private fun AnalyticsTab(viewModel: AdManagementViewModel, state: AdManagementViewModel.State) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                "Platform Analytics",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AnalyticsCard(
                    title = "Total Revenue",
                    value = "KES ${state.totalRevenue.toInt()}",
                    modifier = Modifier.weight(1f),
                    color = KrietaColors.Primary
                )
                AnalyticsCard(
                    title = "Active Campaigns",
                    value = state.activeCampaigns.toString(),
                    modifier = Modifier.weight(1f),
                    color = Color(0xFF43A047)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AnalyticsCard(
                    title = "Total Impressions",
                    value = "${state.totalImpressions / 1000}K",
                    modifier = Modifier.weight(1f),
                    color = KrietaColors.Warning
                )
                AnalyticsCard(
                    title = "Avg CTR",
                    value = "${String.format("%.2f", state.avgCtr)}%",
                    modifier = Modifier.weight(1f),
                    color = KrietaColors.Info
                )
            }
        }
    }
}

@Composable
private fun AnalyticsCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    color: Color
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                title,
                style = MaterialTheme.typography.bodyMedium,
                color = KrietaColors.OnSurfaceVariant
            )
            Spacer(Modifier.height(4.dp))
            Text(
                value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}

@Composable
private fun StatusChip(status: AdStatus) {
    val (color, text) = when (status) {
        AdStatus.PENDING_APPROVAL -> Color(0xFFFFB300) to "Pending"
        AdStatus.APPROVED -> Color(0xFF43A047) to "Approved"
        AdStatus.ACTIVE -> Color(0xFF1E88E5) to "Active"
        AdStatus.PAUSED -> Color(0xFFFF6F00) to "Paused"
        AdStatus.COMPLETED -> Color(0xFF757575) to "Completed"
        AdStatus.REJECTED -> Color(0xFFE53935) to "Rejected"
        else -> Color(0xFF9E9E9E) to "Draft"
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = color.copy(alpha = 0.15f)
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
private fun MetricItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            label,
            style = MaterialTheme.typography.bodySmall,
            color = KrietaColors.OnSurfaceVariant
        )
    }
}

@Composable
private fun EditPlatformCutDialog(
    currentCut: Double,
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit
) {
    var newCut by remember { mutableStateOf(currentCut.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Platform Cut") },
        text = {
            Column {
                Text("Current: $currentCut%")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = newCut,
                    onValueChange = { newCut = it },
                    label = { Text("New Platform Cut (%)") },
                    singleLine = true
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Creator will receive ${100 - (newCut.toDoubleOrNull() ?: currentCut)}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = KrietaColors.OnSurfaceVariant
                )
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(newCut.toDoubleOrNull() ?: currentCut) }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun EditPricingDialog(
    title: String,
    currentMin: Double,
    currentMax: Double,
    onDismiss: () -> Unit,
    onConfirm: (Double, Double) -> Unit
) {
    var minCpm by remember { mutableStateOf(currentMin.toString()) }
    var maxCpm by remember { mutableStateOf(currentMax.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit $title Pricing") },
        text = {
            Column {
                OutlinedTextField(
                    value = minCpm,
                    onValueChange = { minCpm = it },
                    label = { Text("Min CPM (KES)") },
                    singleLine = true
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = maxCpm,
                    onValueChange = { maxCpm = it },
                    label = { Text("Max CPM (KES)") },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(onClick = {
                onConfirm(
                    minCpm.toDoubleOrNull() ?: currentMin,
                    maxCpm.toDoubleOrNull() ?: currentMax
                )
            }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun EditFrequencyDialog(
    title: String,
    currentFrequency: Int,
    onDismiss: () -> Unit,
    onConfirm: (Int) -> Unit
) {
    var frequency by remember { mutableStateOf(currentFrequency.toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit $title Frequency") },
        text = {
            Column {
                Text("Show ad every N posts")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = frequency,
                    onValueChange = { frequency = it },
                    label = { Text("Frequency (posts)") },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(frequency.toIntOrNull() ?: currentFrequency) }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
