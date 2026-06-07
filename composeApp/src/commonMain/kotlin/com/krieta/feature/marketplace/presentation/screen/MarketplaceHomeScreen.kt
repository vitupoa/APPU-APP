package com.krieta.feature.marketplace.presentation.screen
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
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import cafe.adriel.voyager.koin.koinScreenModel
import org.koin.core.parameter.parametersOf
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.profile.domain.model.AccountType
import com.krieta.feature.profile.presentation.viewmodel.ProfileViewModel

class MarketplaceHomeScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val profileViewModel = koinScreenModel<ProfileViewModel> { parametersOf(null) }
        val profileState by profileViewModel.state.collectAsState()
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Brand Marketplace") },
                    actions = {
                        IconButton(onClick = { 
                            navigator.push(GamificationScreenNav())
                        }) {
                            Icon(painterResource(Res.drawable.ic_emoji_events), "Gamification")
                        }
                    }
                )
            }
        ) { padding ->
            when {
                profileState.isLoading -> {
                    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                profileState.error != null -> {
                    Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                        Text("Error: ${profileState.error}")
                    }
                }
                else -> {
                    val accountType = profileState.profile?.accountType ?: AccountType.CREATOR
                    Column(
                        Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        when (accountType) {
                            AccountType.BUSINESS -> BusinessOptions(navigator)
                            AccountType.CREATOR -> CreatorOptions(navigator)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BusinessOptions(navigator: cafe.adriel.voyager.navigator.Navigator) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Business Tools", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        
        MarketplaceCard(
            emoji = "🔍",
            title = "Find Creators",
            subtitle = "Search by followers, engagement, platform",
            gradient = listOf(KrietaColors.Primary.copy(alpha = 0.8f), KrietaColors.Primary),
            onClick = { navigator.push(InfluencerSearchScreenNav()) }
        )
        
        MarketplaceCard(
            emoji = "📋",
            title = "My Campaigns",
            subtitle = "Manage creator campaigns (15% fee)",
            gradient = listOf(KrietaColors.Accent.copy(alpha = 0.8f), KrietaColors.AccentDark),
            onClick = { navigator.push(CampaignListScreenNav(isBrandView = true)) }
        )
        
        MarketplaceCard(
            emoji = "💰",
            title = "Sponsor Contests",
            subtitle = "Drive sales with purchase-to-enter",
            gradient = listOf(KrietaColors.Warning.copy(alpha = 0.8f), KrietaColors.Warning),
            onClick = { 
                // Navigate to contest list to select one to sponsor
                navigator.push(com.krieta.feature.contests.presentation.screen.ContestFeedScreen())
            }
        )
        
        MarketplaceCard(
            emoji = "📊",
            title = "Analytics & ROI",
            subtitle = "Track campaign performance",
            gradient = listOf(Color(0xFF43A047).copy(alpha = 0.8f), Color(0xFF2E7D32)),
            onClick = { 
                // TODO: Navigate to analytics dashboard
            }
        )
    }
}

@Composable
private fun CreatorOptions(navigator: cafe.adriel.voyager.navigator.Navigator) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Creator Hub", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        
        MarketplaceCard(
            emoji = "🎯",
            title = "Browse Campaigns",
            subtitle = "Find brand partnerships",
            gradient = listOf(KrietaColors.Primary.copy(alpha = 0.8f), KrietaColors.Primary),
            onClick = { navigator.push(CampaignListScreenNav(isBrandView = false)) }
        )
        
        MarketplaceCard(
            emoji = "📝",
            title = "My Applications",
            subtitle = "Track campaign applications",
            gradient = listOf(KrietaColors.Accent.copy(alpha = 0.8f), KrietaColors.AccentDark),
            onClick = { 
                // TODO: Navigate to applications screen
            }
        )
        
        MarketplaceCard(
            emoji = "⭐",
            title = "My Profile",
            subtitle = "View creator stats & rating",
            gradient = listOf(KrietaColors.Warning.copy(alpha = 0.8f), KrietaColors.Warning),
            onClick = { 
                navigator.push(com.krieta.feature.profile.presentation.screen.ProfileScreen())
            }
        )
        
        MarketplaceCard(
            emoji = "🏆",
            title = "Join Contests",
            subtitle = "Compete and win prizes",
            gradient = listOf(Color(0xFF43A047).copy(alpha = 0.8f), Color(0xFF2E7D32)),
            onClick = { 
                navigator.push(com.krieta.feature.contests.presentation.screen.ContestFeedScreen())
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MarketplaceCard(
    emoji: String,
    title: String,
    subtitle: String,
    gradient: List<Color>,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(100.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.horizontalGradient(gradient))
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxSize()
            ) {
                Text(emoji, fontSize = 40.sp)
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = Color.White
                    )
                    Text(
                        subtitle,
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.9f)
                    )
                }
                Icon(
                    painterResource(Res.drawable.ic_chevron_right),
                    null,
                    tint = Color.White.copy(alpha = 0.7f)
                )
            }
        }
    }
}
