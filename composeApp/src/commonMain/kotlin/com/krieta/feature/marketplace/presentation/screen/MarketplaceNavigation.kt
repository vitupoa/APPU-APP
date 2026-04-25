package com.krieta.feature.marketplace.presentation.screen

import androidx.compose.runtime.Composable
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

// Voyager Screen wrappers for navigation

class InfluencerSearchScreenNav : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        InfluencerSearchScreen(
            onInfluencerClick = { userId ->
                // Navigate to influencer profile
                navigator.push(com.krieta.feature.profile.presentation.screen.ProfileScreen(userId))
            }
        )
    }
}

class CampaignListScreenNav(
    private val isBrandView: Boolean = true
) : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        CampaignListScreen(
            onCreateClick = {
                navigator.push(CreateCampaignScreenNav())
            },
            onCampaignClick = { campaignId ->
                navigator.push(CampaignDetailScreenNav(campaignId))
            },
            isBrandView = isBrandView
        )
    }
}

class CreateCampaignScreenNav : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        CreateCampaignScreen(
            onSuccess = {
                navigator.pop()
            }
        )
    }
}

class CampaignDetailScreenNav(
    private val campaignId: String
) : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        // TODO: Implement campaign detail screen
        CampaignDetailPlaceholder(campaignId) {
            navigator.pop()
        }
    }
}

class SponsorContestScreenNav(
    private val contestId: String,
    private val contestTitle: String
) : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        SponsorContestScreen(
            contestId = contestId,
            contestTitle = contestTitle,
            onSuccess = {
                navigator.pop()
            }
        )
    }
}

class GamificationScreenNav : Screen {
    @Composable
    override fun Content() {
        GamificationScreen()
    }
}

@Composable
private fun CampaignDetailPlaceholder(campaignId: String, onBack: () -> Unit) {
    androidx.compose.material3.Scaffold(
        topBar = {
            androidx.compose.material3.TopAppBar(
                title = { androidx.compose.material3.Text("Campaign Details") },
                navigationIcon = {
                    androidx.compose.material3.IconButton(onClick = onBack) {
                        androidx.compose.material3.Icon(
                            androidx.compose.material.icons.Icons.AutoMirrored.Filled.ArrowBack,
                            "Back"
                        )
                    }
                }
            )
        }
    ) { padding ->
        androidx.compose.foundation.layout.Box(
            modifier = androidx.compose.ui.Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = androidx.compose.ui.Alignment.Center
        ) {
            androidx.compose.material3.Text("Campaign ID: $campaignId")
        }
    }
}
