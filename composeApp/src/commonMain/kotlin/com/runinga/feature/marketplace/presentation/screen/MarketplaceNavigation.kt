package com.runinga.feature.marketplace.presentation.screen

import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
                navigator.push(com.runinga.feature.profile.presentation.screen.ProfileScreen(userId))
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CampaignDetailPlaceholder(campaignId: String, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Campaign Details") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            painterResource(Res.drawable.ic_arrow_back),
                            "Back"
                        )
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center
        ) {
            Text("Campaign ID: $campaignId")
        }
    }
}
