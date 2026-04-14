package com.krieta.feature.profile.presentation.screen

import cafe.adriel.voyager.core.screen.Screen
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krieta.com.core.theme.KrietaColors

class ProfileScreen(val userId: String? = null) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        var menuExpanded by remember { mutableStateOf(false) }
        
        val isOwnProfile = userId == null
        var isAdmiring by remember { mutableStateOf(false) }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(KrietaColors.Background)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Area with Cover Image
                Box(
                    modifier = Modifier.fillMaxWidth().height(180.dp),
                    contentAlignment = Alignment.TopCenter
                ) {
                    // Cover Banner Placeholder (Dark background)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(130.dp)
                            .background(KrietaColors.BackgroundElevated)
                    )
                    
                    // Top App Bar / Actions over Cover
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Box {
                            IconButton(onClick = { menuExpanded = true }) {
                                Icon(Icons.Default.MoreVert, contentDescription = "Menu", tint = KrietaColors.OnBackground)
                            }
                            DropdownMenu(
                                expanded = menuExpanded,
                                onDismissRequest = { menuExpanded = false },
                                modifier = Modifier.background(KrietaColors.SurfaceVariant)
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Profile Views", color = KrietaColors.OnSurface) },
                                    onClick = { menuExpanded = false }
                                )
                                DropdownMenuItem(
                                    text = { Text("Analytics", color = KrietaColors.OnSurface) },
                                    onClick = { menuExpanded = false }
                                )
                            }
                        }
                    }

                    // Avatar overlapping Cover
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .offset(y = 10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(90.dp)
                                .clip(CircleShape)
                                .background(KrietaColors.SurfaceVariant)
                                .border(3.dp, KrietaColors.Primary, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("U", fontSize = 36.sp, color = KrietaColors.Primary)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // User Info
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "Test Account", 
                        fontWeight = FontWeight.Bold, 
                        fontSize = 22.sp, 
                        color = KrietaColors.OnBackground
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    // Creator Badge
                    Box(
                        modifier = Modifier
                            .border(1.dp, KrietaColors.PrimaryDark, RoundedCornerShape(12.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("★ Creator", fontSize = 10.sp, color = KrietaColors.Primary)
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text("@test_warrior", fontSize = 14.sp, color = KrietaColors.OnSurfaceVariant)
                
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    "Just here for testing the awesome Krieta platform!", 
                    fontSize = 14.sp, 
                    color = KrietaColors.OnSurface,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 24.dp)
                )

                // Social Stats (Admirers, Admiring)
                Spacer(modifier = Modifier.height(20.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AnalyticsStat("1.3K", "Admirers")
                    Spacer(modifier = Modifier.width(32.dp))
                    AnalyticsStat("432", "Admiring")
                }

                // Action buttons
                Spacer(modifier = Modifier.height(20.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (isOwnProfile) {
                        Button(
                            onClick = {}, 
                            modifier = Modifier.weight(1f).height(44.dp),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.SurfaceVariant, contentColor = KrietaColors.OnSurface)
                        ) {
                            Text("Edit Profile", fontWeight = FontWeight.SemiBold)
                        }
                        Button(
                            onClick = {}, 
                            modifier = Modifier.weight(1f).height(44.dp),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, KrietaColors.Outline),
                            colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.Surface, contentColor = KrietaColors.Primary)
                        ) {
                            Text("Wallet", fontWeight = FontWeight.SemiBold, color = KrietaColors.Primary)
                        }
                    } else {
                        Button(
                            onClick = { isAdmiring = !isAdmiring }, 
                            modifier = Modifier.weight(1f).height(44.dp),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isAdmiring) KrietaColors.SurfaceVariant else KrietaColors.Accent, 
                                contentColor = if (isAdmiring) KrietaColors.OnSurface else KrietaColors.OnAccent
                            )
                        ) {
                            Text(if (isAdmiring) "Unadmire" else "Admire", fontWeight = FontWeight.SemiBold)
                        }
                        Button(
                            onClick = {}, 
                            modifier = Modifier.weight(1f).height(44.dp),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.SurfaceVariant, contentColor = KrietaColors.OnSurface)
                        ) {
                            Text("Message", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                // Milestones and Bio Link
                Spacer(modifier = Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Text("🎯 Milestones", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = KrietaColors.PrimaryLight)
                    Text("🔗 Bio Link", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = KrietaColors.PrimaryLight)
                }

                // Tabs Configuration (No Grid requested)
                Spacer(modifier = Modifier.height(24.dp))
                var selectedTab by remember { mutableStateOf(0) }
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.Transparent,
                    contentColor = KrietaColors.Primary
                ) {
                    val tabs = listOf("Videos", "Contests", "Liked")
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index, 
                            onClick = { selectedTab = index }
                        ) { 
                            Text(
                                title, 
                                modifier = Modifier.padding(16.dp), 
                                fontWeight = FontWeight.SemiBold,
                                color = if (selectedTab == index) KrietaColors.OnBackground else KrietaColors.OnSurfaceVariant
                            ) 
                        }
                    }
                }

                // Empty space since Grid is excluded
                Spacer(modifier = Modifier.height(300.dp))
            }
        }
    }
}

@Composable
private fun AnalyticsStat(count: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(count, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = KrietaColors.OnBackground)
        Text(label, fontSize = 13.sp, color = KrietaColors.OnSurfaceVariant)
    }
}
