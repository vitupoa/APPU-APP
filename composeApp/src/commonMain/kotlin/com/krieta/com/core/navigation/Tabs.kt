package com.krieta.com.core.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.Icon
import cafe.adriel.voyager.navigator.currentOrThrow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import com.krieta.com.core.theme.KrietaColors

object HomeTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.Home)
            return remember { TabOptions(index = 0u, title = "Home", icon = icon) }
        }

    @Composable
    override fun Content() {
        var selectedTabIndex by remember { mutableStateOf(0) }
        val tabs = listOf("Admiring", "Discover", "Contests")

        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Top Navigation Tabs
                TabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = Color.Transparent,
                    contentColor = KrietaColors.OnSurface,
                    divider = {},
                    indicator = { tabPositions ->
                        TabRowDefaults.Indicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                            color = KrietaColors.Primary,
                            height = 3.dp
                        )
                    },
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
                ) {
                    tabs.forEachIndexed { index, title ->
                        androidx.compose.material3.Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = {
                                Text(
                                    text = title,
                                    fontSize = 17.sp,
                                    fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Medium,
                                    color = if (selectedTabIndex == index) KrietaColors.OnSurface else KrietaColors.OnSurfaceVariant
                                )
                            }
                        )
                    }
                }

                // Feed Content ViewPager
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    when (selectedTabIndex) {
                        0 -> com.krieta.feature.feed.presentation.screen.FeedScreen().Content()
                        1 -> com.krieta.feature.feed.presentation.screen.FeedScreen().Content()
                        2 -> com.krieta.feature.contests.presentation.screen.ContestFeedSwipeScreen().Content()
                    }
                }
            }
        }
    }
}

object DiscoverTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.Search)
            return remember { TabOptions(index = 1u, title = "Discover", icon = icon) }
        }

    @Composable
    override fun Content() {
        // Will be replaced with DiscoverScreen (For You feed + search)
        PlaceholderTab("Discover")
    }
}

object ContestsTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.Star)
            return remember { TabOptions(index = 2u, title = "Contests", icon = icon) }
        }

    @Composable
    override fun Content() {
        val navigator = cafe.adriel.voyager.navigator.LocalNavigator.currentOrThrow
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            // Embedded Contest Feed Screen
            com.krieta.feature.contests.presentation.screen.ContestFeedScreen().Content()
        }
    }
}

object ShopTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.ShoppingCart)
            return remember { TabOptions(index = 3u, title = "Shop", icon = icon) }
        }

    @Composable
    override fun Content() {
        // Will be replaced with ShopScreen
        PlaceholderTab("Shop")
    }
}

object ProfileTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.Person)
            return remember { TabOptions(index = 4u, title = "Profile", icon = icon) }
        }

    @Composable
    override fun Content() {
        com.krieta.feature.profile.presentation.screen.ProfileScreen()
    }
}

@Composable
private fun PlaceholderTab(name: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = name,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}
