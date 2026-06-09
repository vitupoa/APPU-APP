package com.krieta.feature.feed.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen

class HomeScreen : Screen {
    @Composable
    override fun Content() {
        var selectedTab by remember { mutableStateOf(1) } // Default to Discover

        Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
            // Content based on selected tab - render only the selected screen
            key(selectedTab) {
                when (selectedTab) {
                    0 -> com.krieta.feature.contests.presentation.screen.ContestSubmissionFeedScreen().Content()
                    1 -> com.krieta.feature.shorts.presentation.screen.ShortsScreen(feedType = com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType.DISCOVER).Content()
                    2 -> com.krieta.feature.shorts.presentation.screen.ShortsScreen(feedType = com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType.ADMIRING).Content()
                }
            }

            // Tab bar floats over the video, respects status bar at top
            HomeTabBar(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it },
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .windowInsetsPadding(WindowInsets.statusBars)
            )
        }
    }

    @Composable
    private fun HomeTabBar(
        selectedTab: Int,
        onTabSelected: (Int) -> Unit,
        modifier: Modifier = Modifier
    ) {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            listOf("Contests", "Discover", "Admiring").forEachIndexed { index, label ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    TextButton(onClick = { onTabSelected(index) }) {
                        Text(
                            label,
                            color = if (selectedTab == index) Color.White else Color.White.copy(alpha = 0.5f),
                            fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 16.sp
                        )
                    }
                    if (selectedTab == index) {
                        Box(
                            modifier = Modifier
                                .width(40.dp)
                                .height(3.dp)
                                .background(Color(0xFFFFD700))
                        )
                    }
                }
                if (index < 2) {
                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .height(20.dp)
                            .background(Color.White.copy(alpha = 0.3f))
                    )
                }
            }
        }
    }
}
