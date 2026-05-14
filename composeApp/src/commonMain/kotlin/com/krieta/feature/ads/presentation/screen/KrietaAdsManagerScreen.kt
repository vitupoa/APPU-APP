package com.krieta.feature.ads.presentation.screen

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors

class KrietaAdsManagerScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var selectedTab by remember { mutableStateOf(0) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Krieta Ads Manager", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
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
                PrimaryTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = KrietaColors.BackgroundElevated
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Display Ads") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Sponsored Content") }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("Boost Content") }
                    )
                }

                when (selectedTab) {
                    0 -> DisplayAdsTab(
                        onCreateCampaign = {
                            navigator.push(CreateDisplayAdCampaignScreen())
                        }
                    )
                    1 -> SponsoredContentTab(
                        onCreateCampaign = {
                            navigator.push(com.krieta.feature.sponsored.presentation.screen.CreateCampaignScreen())
                        }
                    )
                    2 -> BoostContentTab()
                }
            }
        }
    }
}

@Composable
private fun DisplayAdsTab(onCreateCampaign: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Icon(
                        Icons.Default.Campaign,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "Display Advertising",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Create professional ad campaigns that appear across Krieta platform",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = onCreateCampaign,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Create Display Ad Campaign")
                    }
                }
            }
        }

        item {
            Text("Ad Placements", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        item {
            PlacementCard(
                icon = Icons.Default.Videocam,
                title = "Live Streams",
                description = "Banner ads during live streaming sessions",
                cpmRange = "KES 40-150"
            )
        }

        item {
            PlacementCard(
                icon = Icons.Default.EmojiEvents,
                title = "Contests",
                description = "Sponsor banners in contest submissions",
                cpmRange = "KES 50-180"
            )
        }

        item {
            PlacementCard(
                icon = Icons.Default.Explore,
                title = "Discover & Admiring",
                description = "Native ads in shorts feeds",
                cpmRange = "KES 45-160"
            )
        }

        item {
            PlacementCard(
                icon = Icons.Default.Newspaper,
                title = "Drips Feed",
                description = "Native ads in post feed",
                cpmRange = "KES 40-150"
            )
        }

        item {
            PlacementCard(
                icon = Icons.Default.AutoStories,
                title = "Stories",
                description = "Full-screen story ads",
                cpmRange = "KES 80-200"
            )
        }

        item {
            PlacementCard(
                icon = Icons.AutoMirrored.Filled.Chat,
                title = "Group & Chama Chats",
                description = "Targeted ads in niche communities",
                cpmRange = "KES 60-200"
            )
        }
    }
}

@Composable
private fun SponsoredContentTab(onCreateCampaign: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Icon(
                        Icons.Default.Star,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "Sponsored Content",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Promote your existing shorts or posts as native sponsored content",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = onCreateCampaign,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Create Sponsored Campaign")
                    }
                }
            }
        }

        item {
            Text("What Can Be Sponsored?", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        item {
            SponsoredTypeCard(
                icon = Icons.Default.VideoLibrary,
                title = "Shorts",
                description = "Your short videos appear as native content in Discover and Admiring feeds with 'Sponsored' badge"
            )
        }

        item {
            SponsoredTypeCard(
                icon = Icons.Default.Image,
                title = "Drips (Posts)",
                description = "Your posts appear in Drips feed as native sponsored content"
            )
        }

        item {
            Text("Pricing Models", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        item {
            PricingModelCard("CPM", "Cost per 1,000 impressions", "Best for brand awareness")
        }

        item {
            PricingModelCard("CPV", "Cost per view (3+ seconds)", "Best for engagement")
        }

        item {
            PricingModelCard("CPE", "Cost per engagement", "Best for interactions")
        }

        item {
            PricingModelCard("CPC", "Cost per click", "Best for traffic")
        }
    }
}

@Composable
private fun BoostContentTab() {
    val navigator = LocalNavigator.currentOrThrow
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.tertiaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Icon(
                        Icons.AutoMirrored.Filled.TrendingUp,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.tertiary
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "Boost Your Content",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Increase reach and engagement on your existing content",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { navigator.push(BoostContentScreen()) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Boost Content")
                    }
                }
            }
        }

        item {
            Text("What You Can Boost", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        item {
            BoostTypeCard(
                icon = Icons.Default.VideoLibrary,
                title = "Shorts",
                description = "Boost your short videos to reach more viewers in Discover and Admiring feeds"
            )
        }

        item {
            BoostTypeCard(
                icon = Icons.Default.Image,
                title = "Drips (Posts)",
                description = "Boost your posts to appear more frequently in followers' feeds"
            )
        }

        item {
            BoostTypeCard(
                icon = Icons.Default.Videocam,
                title = "Live Streams",
                description = "Promote upcoming or past live streams to increase viewership"
            )
        }

        item {
            Text("How It Works", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    HowItWorksStep("1", "Select content to boost")
                    HowItWorksStep("2", "Set your budget (min KES 500)")
                    HowItWorksStep("3", "Choose duration (3-30 days)")
                    HowItWorksStep("4", "Your content gets priority placement")
                }
            }
        }
    }
}

@Composable
private fun PlacementCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    cpmRange: String
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold)
                Text(
                    description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "CPM: $cpmRange",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun SponsoredTypeCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.secondary
            )
            Column {
                Text(title, fontWeight = FontWeight.Bold)
                Text(
                    description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun BoostTypeCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.tertiary
            )
            Column {
                Text(title, fontWeight = FontWeight.Bold)
                Text(
                    description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun PricingModelCard(model: String, description: String, bestFor: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(model, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Text(
                description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                bestFor,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun HowItWorksStep(number: String, text: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(
                    MaterialTheme.colorScheme.primaryContainer,
                    RoundedCornerShape(16.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                number,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
        Text(text)
    }
}

class CreateDisplayAdCampaignScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        CreateDisplayAdCampaignScreen(onNavigateBack = { navigator.pop() })
    }
}
