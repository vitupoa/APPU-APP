package com.krieta.feature.feed.presentation.screen

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen

private val tabs = listOf("Contests", "Discover", "Lovers", "Admiring")

class HomeScreen : Screen {
    @Composable
    override fun Content() {
        var selectedTab by remember { mutableStateOf(1) } // Default: Discover

        // fillMaxSize with no inset padding so content bleeds behind
        // the status bar (battery/time row) and nav bar
        Box(modifier = Modifier.fillMaxSize()) {
            // Full-screen feed rendered first, sits behind everything
            key(selectedTab) {
                when (selectedTab) {
                    0 -> com.krieta.feature.contests.presentation.screen
                        .ContestSubmissionFeedScreen().Content()
                    1 -> com.krieta.feature.shorts.presentation.screen
                        .ShortsScreen(com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType.DISCOVER).Content()
                    2 -> com.krieta.feature.shorts.presentation.screen
                        .ShortsScreen(com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType.LOVERS).Content()
                    3 -> com.krieta.feature.shorts.presentation.screen
                        .ShortsScreen(com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType.ADMIRING).Content()
                }
            }

            // Floating tab bar overlays the feed at the very top.
            // statusBarsPadding() only shifts the tab row below the status bar;
            // the video behind it is untouched and fills all the way to the top edge.
            HomeTabBar(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it },
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
            )
        }
    }

    @Composable
    private fun HomeTabBar(
        selectedTab: Int,
        onTabSelected: (Int) -> Unit,
        modifier: Modifier = Modifier
    ) {
        Box(
            modifier = modifier
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Black.copy(alpha = 0.3f),
                            Color.Transparent
                        )
                    )
                )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(top = 40.dp)
                    .padding(horizontal = 8.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                tabs.forEachIndexed { index, label ->
                    TabItem(
                        label = label,
                        isSelected = selectedTab == index,
                        onClick = { onTabSelected(index) }
                    )
                }
            }
        }
    }

    @Composable
    private fun TabItem(
        label: String,
        isSelected: Boolean,
        onClick: () -> Unit
    ) {
        val textAlpha by animateFloatAsState(
            targetValue = if (isSelected) 1f else 0.55f,
            animationSpec = tween(200),
            label = "tabAlpha"
        )
        val indicatorWidth by animateDpAsState(
            targetValue = if (isSelected) 28.dp else 0.dp,
            animationSpec = tween(220),
            label = "indicatorWidth"
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .clickable(
                    indication = null,
                    interactionSource = remember { MutableInteractionSource() },
                    onClick = onClick
                )
                .padding(horizontal = 4.dp, vertical = 4.dp)
        ) {
            Text(
                text = label,
                color = Color.White.copy(alpha = textAlpha),
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 14.sp,
                letterSpacing = 0.3.sp
            )
            Spacer(Modifier.height(4.dp))
            // Animated gold-to-orange pill indicator
            Box(
                modifier = Modifier
                    .height(2.5.dp)
                    .width(indicatorWidth)
                    .clip(RoundedCornerShape(50))
                    .background(
                        if (isSelected)
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFFFFD700), Color(0xFFFFA500))
                            )
                        else
                            Brush.horizontalGradient(
                                listOf(Color.Transparent, Color.Transparent)
                            )
                    )
            )
        }
    }
}
