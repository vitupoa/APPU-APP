package com.krieta.com.core.navigation
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.systemBars
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.tab.CurrentTab
import cafe.adriel.voyager.navigator.tab.LocalTabNavigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabNavigator
import com.krieta.com.core.theme.KrietaColors

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.krieta.com.core.util.BackHandler
import com.krieta.com.core.util.exitApp

@OptIn(ExperimentalMaterial3Api::class)
class MainScreen : Screen {

    @Composable
    override fun Content() {
        var showCreateSheet by remember { mutableStateOf(false) }
        var backPressedOnce by remember { mutableStateOf(false) }
        var homeRefreshKey by remember { mutableStateOf(0) }
        var showFAB by remember { mutableStateOf(true) }
        val scope = rememberCoroutineScope()

        TabNavigator(HomeTab) {
            val tabNavigator = LocalTabNavigator.current
            val currentTab = tabNavigator.current
            
            // Smart FAB visibility: hide on Home (immersive videos), show on others
            LaunchedEffect(currentTab) {
                showFAB = currentTab != HomeTab
            }
            
            BackHandler {
                when (currentTab) {
                    HomeTab -> {
                        if (backPressedOnce) {
                            exitApp()
                        } else {
                            backPressedOnce = true
                            homeRefreshKey++
                            scope.launch {
                                delay(2000)
                                backPressedOnce = false
                            }
                        }
                    }
                    ProfileTab, ChatsTab, ExploreTab -> {
                        tabNavigator.current = HomeTab
                    }
                    else -> {
                        tabNavigator.current = HomeTab
                    }
                }
            }
            
            Scaffold(
                modifier = Modifier.fillMaxSize(),
                containerColor = MaterialTheme.colorScheme.background,
                contentWindowInsets = WindowInsets(0, 0, 0, 0),
                bottomBar = { 
                    KrietaBottomBar(
                        onCreateClick = { showCreateSheet = true },
                        showFAB = showFAB
                    ) 
                },
                content = { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        key(if (currentTab == HomeTab) homeRefreshKey else 0) {
                            CurrentTab()
                        }
                    }
                }
            )
        }

        if (showCreateSheet) {
            CreateBottomSheet(onDismiss = { showCreateSheet = false })
        }
    }
}

@Composable
private fun KrietaBottomBar(onCreateClick: () -> Unit, showFAB: Boolean) {
    NavigationBar(
        containerColor = KrietaColors.BackgroundElevated,
        contentColor = KrietaColors.OnSurface,
    ) {
        TabItem(HomeTab)
        TabItem(DripsTab)
        TabItem(ExploreTab)
        
        // Smart FAB: appears/disappears based on context
        if (showFAB) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(KrietaColors.Primary)
                        .clickable { onCreateClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painter = painterResource(Res.drawable.ic_add),
                        contentDescription = "Create",
                        tint = KrietaColors.Background,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }
        
        TabItem(ChatsTab)
        TabItem(ProfileTab)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateBottomSheet(onDismiss: () -> Unit) {
    val navigator = LocalNavigator.currentOrThrow
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = KrietaColors.BackgroundElevated,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp, top = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Create New", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = KrietaColors.OnSurface)
            Spacer(modifier = Modifier.height(24.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                CreateOption("Drip", "📸", KrietaColors.Primary) {
                    navigator.push(com.krieta.feature.feed.presentation.screen.CreatePostScreen())
                    onDismiss()
                }
                CreateOption("Short", "🎥", Color(0xFFE53935)) {
                    navigator.push(com.krieta.feature.shorts.presentation.screen.CreateShortScreen())
                    onDismiss()
                }
                CreateOption("Contest", "🏆", Color(0xFFFFB300)) {
                    navigator.push(com.krieta.feature.contests.presentation.screen.CreateContestScreen())
                    onDismiss()
                }
                CreateOption("Product", "🛍️", Color(0xFF43A047)) {
                    navigator.push(com.krieta.feature.shop.presentation.screen.CreateListingScreen())
                    onDismiss()
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                CreateOption("Live", "📹", Color(0xFFFF1744)) {
                    navigator.push(com.krieta.feature.live.presentation.screen.StartLiveScreen())
                    onDismiss()
                }
            }
        }
    }
}

@Composable
private fun CreateOption(title: String, emoji: String, color: Color, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { onClick() }) {
        Box(
            modifier = Modifier.size(60.dp).clip(CircleShape).background(color.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(text = emoji, fontSize = 28.sp)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = KrietaColors.OnSurface)
    }
}

@Composable
private fun RowScope.TabItem(tab: Tab) {
    val tabNavigator = LocalTabNavigator.current
    val isSelected = tabNavigator.current.key == tab.key

    NavigationBarItem(
        selected = isSelected,
        onClick = { tabNavigator.current = tab },
        icon = {
            tab.options.icon?.let { painter ->
                Icon(
                    painter = painter,
                    contentDescription = tab.options.title
                )
            }
        },
        label = {
            Text(
                text = tab.options.title,
                style = MaterialTheme.typography.labelSmall
            )
        },
        colors = NavigationBarItemDefaults.colors(
            selectedIconColor = KrietaColors.Primary,
            selectedTextColor = KrietaColors.Primary,
            unselectedIconColor = KrietaColors.OnSurfaceVariant,
            unselectedTextColor = KrietaColors.OnSurfaceVariant,
            indicatorColor = KrietaColors.PrimaryContainer
        )
    )
}

