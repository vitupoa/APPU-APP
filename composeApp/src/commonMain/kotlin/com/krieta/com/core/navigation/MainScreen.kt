package com.krieta.com.core.navigation

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
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

class MainScreen : Screen {

    @Composable
    override fun Content() {
        TabNavigator(HomeTab) {
            Scaffold(
                containerColor = MaterialTheme.colorScheme.background,
                bottomBar = { KrietaBottomBar() },
                content = { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        CurrentTab()
                    }
                }
            )
        }
    }
}

@Composable
private fun KrietaBottomBar() {
    NavigationBar(
        containerColor = KrietaColors.BackgroundElevated,
        contentColor = KrietaColors.OnSurface,
    ) {
        TabItem(HomeTab)
        TabItem(DiscoverTab)
        TabItem(ContestsTab)
        TabItem(ShopTab)
        TabItem(ProfileTab)
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

