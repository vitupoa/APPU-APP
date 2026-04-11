package com.krieta.feature.profile.presentation.screen

import cafe.adriel.voyager.core.screen.Screen
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krieta.com.core.theme.KrietaColors

class ProfileScreen(val userId: String? = null) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        Column(
            modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
        ) {
        // App Bar
        CenterAlignedTopAppBar(
            title = { Text("@username", fontWeight = FontWeight.Bold) },
            colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                containerColor = Color.Transparent
            )
        )

        // Header Analytics
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(80.dp).clip(CircleShape).background(KrietaColors.PrimaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text("U", fontSize = 32.sp, color = KrietaColors.Primary)
            }
            Spacer(modifier = Modifier.width(24.dp))
            AnalyticsStat("24", "Posts")
            Spacer(modifier = Modifier.width(16.dp))
            AnalyticsStat("12.4k", "Followers")
            Spacer(modifier = Modifier.width(16.dp))
            AnalyticsStat("105", "Following")
        }

        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = {}, 
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.SurfaceVariant, contentColor = KrietaColors.OnSurface)
            ) {
                Text("Edit Profile", fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = {}, 
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.SurfaceVariant, contentColor = KrietaColors.OnSurface)
            ) {
                Text("Share Profile", fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Content Tabs
        var selectedTab by remember { mutableStateOf(0) }
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color.Transparent,
            contentColor = KrietaColors.OnSurface,
        ) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) { Text("Grid", modifier = Modifier.padding(16.dp)) }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) { Text("Shorts", modifier = Modifier.padding(16.dp)) }
        }

        // Masonry Layout Placeholder
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(1.dp)
        ) {
            items(21) {
                Box(
                    modifier = Modifier.aspectRatio(1f).padding(1.dp).background(KrietaColors.SurfaceVariant)
                )
            }
        }
    }
}
}

@Composable
private fun AnalyticsStat(count: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(count, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = KrietaColors.OnSurface)
        Text(label, fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
    }
}
