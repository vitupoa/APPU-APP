package com.krieta.feature.marketplace.presentation.screen
import com.krieta.com.core.util.parseColor
import com.krieta.com.core.util.formatString
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.marketplace.domain.model.*
import com.krieta.com.core.theme.KrietaColors

class SocialMediaManagementScreen(
    private val influencerId: String
) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var accounts by remember { mutableStateOf<List<SocialMediaAccount>>(emptyList()) }
        var showAddDialog by remember { mutableStateOf(false) }
        var isLoading by remember { mutableStateOf(true) }
        
        // TODO: Load accounts from API
        LaunchedEffect(influencerId) {
            // accounts = viewModel.loadSocialAccounts(influencerId)
            isLoading = false
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Social Media Accounts") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
                )
            },
            floatingActionButton = {
                FloatingActionButton(onClick = { showAddDialog = true }) {
                    Icon(painterResource(Res.drawable.ic_add), "Add Account")
                }
            }
        ) { padding ->
            if (isLoading) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    Modifier.fillMaxSize().padding(padding).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Total Reach Card
                    item {
                        TotalReachCard(accounts)
                    }
                    
                    // Connected Accounts
                    item {
                        Text(
                            "Connected Accounts",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    if (accounts.isEmpty()) {
                        item {
                            EmptyStateCard()
                        }
                    } else {
                        items(accounts) { account ->
                            SocialAccountCard(
                                account = account,
                                onSync = { /* TODO: Sync account */ },
                                onSetPrimary = { /* TODO: Set primary */ },
                                onDelete = { /* TODO: Delete account */ }
                            )
                        }
                    }
                    
                    // Available Platforms
                    item {
                        Spacer(Modifier.height(16.dp))
                        Text(
                            "Add More Platforms",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    item {
                        AvailablePlatformsGrid(
                            connectedPlatforms = accounts.map { it.platform },
                            onPlatformClick = { platform ->
                                showAddDialog = true
                            }
                        )
                    }
                }
            }
        }
        
        if (showAddDialog) {
            AddSocialAccountDialog(
                onDismiss = { showAddDialog = false },
                onAdd = { platform, username ->
                    // TODO: Add account
                    showAddDialog = false
                }
            )
        }
    }
}

@Composable
private fun TotalReachCard(accounts: List<SocialMediaAccount>) {
    val totalFollowers = accounts.sumOf { it.followerCount + it.subscriberCount }
    val avgEngagement = if (accounts.isNotEmpty()) {
        accounts.map { it.engagementRate }.average()
    } else 0.0
    
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.PrimaryContainer
        )
    ) {
        Column(Modifier.padding(20.dp)) {
            Text("Total Reach", style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(8.dp))
            Text(
                formatNumber(totalFollowers),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Avg. Engagement: ${formatString("%.2f", avgEngagement)}%",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun SocialAccountCard(
    account: SocialMediaAccount,
    onSync: () -> Unit,
    onSetPrimary: () -> Unit,
    onDelete: () -> Unit
) {
    val platformInfo = PLATFORM_INFO[account.platform]!!
    var showMenu by remember { mutableStateOf(false) }
    
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Platform Icon
                    Box(
                        Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color(parseColor(platformInfo.color)).copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(platformInfo.icon, fontSize = 24.sp)
                    }
                    
                    Spacer(Modifier.width(12.dp))
                    
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                platformInfo.name,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            if (account.isVerified) {
                                Spacer(Modifier.width(4.dp))
                                Icon(
                                    painterResource(Res.drawable.ic_verified),
                                    "Verified",
                                    Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                            if (account.isPrimary) {
                                Spacer(Modifier.width(4.dp))
                                Surface(
                                    color = MaterialTheme.colorScheme.primary,
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        "PRIMARY",
                                        Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                        Text(
                            "@${account.username}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                IconButton(onClick = { showMenu = true }) {
                    Icon(painterResource(Res.drawable.ic_more_vert), "Options")
                }
                
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Sync Now") },
                        onClick = {
                            onSync()
                            showMenu = false
                        },
                        leadingIcon = { Icon(painterResource(Res.drawable.ic_sync), null) }
                    )
                    if (!account.isPrimary) {
                        DropdownMenuItem(
                            text = { Text("Set as Primary") },
                            onClick = {
                                onSetPrimary()
                                showMenu = false
                            },
                            leadingIcon = { Icon(painterResource(Res.drawable.ic_star), null) }
                        )
                    }
                    DropdownMenuItem(
                        text = { Text("Delete") },
                        onClick = {
                            onDelete()
                            showMenu = false
                        },
                        leadingIcon = { Icon(painterResource(Res.drawable.ic_delete), null) }
                    )
                }
            }
            
            Spacer(Modifier.height(12.dp))
            
            // Metrics
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                MetricItem(
                    label = platformInfo.followerLabel,
                    value = formatNumber(account.followerCount + account.subscriberCount)
                )
                MetricItem(
                    label = "Engagement",
                    value = "${formatString("%.1f", account.engagementRate)}%"
                )
                MetricItem(
                    label = "Avg Views",
                    value = formatNumber(account.avgViews)
                )
            }
            
            // Sync Status
            if (account.lastSyncedAt != null) {
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        painterResource(Res.drawable.ic_check),
                        null,
                        Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "Last synced: ${account.lastSyncedAt}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
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
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun EmptyStateCard() {
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            Modifier.fillMaxWidth().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("🔗", fontSize = 48.sp)
            Spacer(Modifier.height(16.dp))
            Text(
                "No accounts connected",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Connect your social media accounts to showcase your reach",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
private fun AvailablePlatformsGrid(
    connectedPlatforms: List<SocialPlatform>,
    onPlatformClick: (SocialPlatform) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        SocialPlatform.entries.chunked(4).forEach { row ->
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { platform ->
                    val info = PLATFORM_INFO[platform]!!
                    val isConnected = connectedPlatforms.contains(platform)
                    
                    Card(
                        modifier = Modifier.weight(1f).height(80.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isConnected) 
                                MaterialTheme.colorScheme.surfaceVariant 
                            else 
                                MaterialTheme.colorScheme.surface
                        ),
                        onClick = { if (!isConnected) onPlatformClick(platform) }
                    ) {
                        Column(
                            Modifier.fillMaxSize().padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text(info.icon, fontSize = 24.sp)
                            Spacer(Modifier.height(4.dp))
                            Text(
                                info.name.split(" ").first(),
                                style = MaterialTheme.typography.labelSmall,
                                maxLines = 1
                            )
                            if (isConnected) {
                                Icon(
                                    painterResource(Res.drawable.ic_check),
                                    null,
                                    Modifier.size(12.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddSocialAccountDialog(
    onDismiss: () -> Unit,
    onAdd: (SocialPlatform, String) -> Unit
) {
    var selectedPlatform by remember { mutableStateOf<SocialPlatform?>(null) }
    var username by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Social Account") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Platform Selector
                Text("Select Platform", style = MaterialTheme.typography.labelMedium)
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(
                        SocialPlatform.TIKTOK,
                        SocialPlatform.YOUTUBE,
                        SocialPlatform.INSTAGRAM,
                        SocialPlatform.TWITTER
                    ).forEach { platform ->
                        val info = PLATFORM_INFO[platform]!!
                        FilterChip(
                            selected = selectedPlatform == platform,
                            onClick = { selectedPlatform = platform },
                            label = { Text(info.icon + " " + info.name.split(" ").first()) }
                        )
                    }
                }
                
                // Username Input
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("Username") },
                    placeholder = { Text("@username") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                selectedPlatform?.let { platform ->
                    val info = PLATFORM_INFO[platform]!!
                    if (info.requiresAuth) {
                        Text(
                            "⚠️ ${info.name} requires OAuth authentication",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    selectedPlatform?.let { platform ->
                        if (username.isNotBlank()) {
                            onAdd(platform, username.removePrefix("@"))
                        }
                    }
                },
                enabled = selectedPlatform != null && username.isNotBlank()
            ) {
                Text("Add Account")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun formatNumber(num: Int): String {
    return when {
        num >= 1_000_000 -> "${num / 1_000_000}M"
        num >= 1_000 -> "${num / 1_000}K"
        else -> num.toString()
    }
}


