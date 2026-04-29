package com.krieta.feature.marketplace.presentation.oauth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

class ConnectSocialAccountsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = getScreenModel<OAuthViewModel>()
        val state by viewModel.state.collectAsState()
        
        // Handle OAuth URL
        LaunchedEffect(null) {
            null?.let { url ->
                // Open browser with OAuth URL
                // Platform-specific implementation needed
                // cleared
            }
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Connect Social Accounts") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            }
        ) { padding ->
            if (state.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = KrietaColors.Primary.copy(alpha = 0.1f)
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    "Verify Your Influence",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    "Connect your social media accounts to verify your follower count and unlock brand partnership opportunities.",
                                    fontSize = 14.sp,
                                    color = KrietaColors.OnSurfaceVariant
                                )
                            }
                        }
                    }
                    
                    item {
                        Text(
                            "Available Platforms",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    // TikTok
                    item {
                        SocialPlatformCard(
                            platform = "TikTok",
                            icon = Res.drawable.ic_share,
                            connected = state.accounts.any { it.platform == "TIKTOK" },
                            account = state.accounts.find { it.platform == "TIKTOK" },
                            onConnect = { viewModel.connectAccount("tiktok") },
                            onDisconnect = { viewModel.disconnectAccount("tiktok") },
                            isConnecting = state.isConnecting
                        )
                    }
                    
                    // Instagram
                    item {
                        SocialPlatformCard(
                            platform = "Instagram",
                            icon = Res.drawable.ic_camera,
                            connected = state.accounts.any { it.platform == "INSTAGRAM" },
                            account = state.accounts.find { it.platform == "INSTAGRAM" },
                            onConnect = { viewModel.connectAccount("instagram") },
                            onDisconnect = { viewModel.disconnectAccount("instagram") },
                            isConnecting = state.isConnecting
                        )
                    }
                    
                    // YouTube
                    item {
                        SocialPlatformCard(
                            platform = "YouTube",
                            icon = Res.drawable.ic_videocam,
                            connected = state.accounts.any { it.platform == "YOUTUBE" },
                            account = state.accounts.find { it.platform == "YOUTUBE" },
                            onConnect = { viewModel.connectAccount("youtube") },
                            onDisconnect = { viewModel.disconnectAccount("youtube") },
                            isConnecting = state.isConnecting
                        )
                    }
                    
                    state.error?.let { error ->
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = KrietaColors.Error.copy(alpha = 0.1f)
                                )
                            ) {
                                Text(
                                    error,
                                    modifier = Modifier.padding(16.dp),
                                    color = KrietaColors.Error
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SocialPlatformCard(
    platform: String,
    icon: org.jetbrains.compose.resources.DrawableResource,
    connected: Boolean,
    account: SocialAccount?,
    onConnect: () -> Unit,
    onDisconnect: () -> Unit,
    isConnecting: Boolean
) {
    var showDisconnectDialog by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (connected) {
                KrietaColors.Success.copy(alpha = 0.1f)
            } else {
                KrietaColors.BackgroundElevated
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Platform Icon
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painterResource(icon),
                    contentDescription = platform,
                    modifier = Modifier.size(32.dp)
                )
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(platform, fontWeight = FontWeight.Bold)
                
                if (connected && account != null) {
                    Text(
                        "@${account.username}",
                        fontSize = 12.sp,
                        color = KrietaColors.OnSurfaceVariant
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${formatNumber(account.followerCount)} followers",
                            fontSize = 12.sp,
                            color = KrietaColors.Success
                        )
                        if (account.isVerified) {
                            Icon(
                                painterResource(Res.drawable.ic_check),
                                contentDescription = "Verified",
                                modifier = Modifier.size(12.dp),
                                tint = KrietaColors.Success
                            )
                        }
                    }
                } else {
                    Text(
                        "Not connected",
                        fontSize = 12.sp,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }
            }
            
            if (connected) {
                TextButton(onClick = { showDisconnectDialog = true }) {
                    Text("Disconnect", color = KrietaColors.Error)
                }
            } else {
                Button(
                    onClick = onConnect,
                    enabled = !isConnecting
                ) {
                    Text("Connect")
                }
            }
        }
    }
    
    if (showDisconnectDialog) {
        AlertDialog(
            onDismissRequest = { showDisconnectDialog = false },
            title = { Text("Disconnect $platform?") },
            text = { Text("This will remove your $platform account verification. You can reconnect anytime.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDisconnect()
                        showDisconnectDialog = false
                    }
                ) {
                    Text("Disconnect", color = KrietaColors.Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDisconnectDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

private fun formatNumber(number: Int): String {
    return when {
        number >= 1_000_000 -> "${number / 1_000_000}M"
        number >= 1_000 -> "${number / 1_000}K"
        else -> number.toString()
    }
}
