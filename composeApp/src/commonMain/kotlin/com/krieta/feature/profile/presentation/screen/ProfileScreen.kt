package com.krieta.feature.profile.presentation.screen

import cafe.adriel.voyager.core.screen.Screen
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.wallet.presentation.screen.WalletScreen
import kotlinx.coroutines.delay

data class BioLink(val id: String, val title: String, val url: String)

class ProfileScreen(val userId: String? = null) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var menuExpanded by remember { mutableStateOf(false) }
        var isRefreshing by remember { mutableStateOf(false) }
        var showBioLinkSheet by remember { mutableStateOf(false) }
        
        val isOwnProfile = userId == null
        var isAdmiring by remember { mutableStateOf(false) }
        val pullRefreshState = rememberPullToRefreshState()

        // Mock Bio Links
        var bioLinks by remember { 
            mutableStateOf(listOf(
                BioLink("1", "My Portfolio", "https://krieta.app/portfolio"),
                BioLink("2", "Latest Sip", "https://krieta.app/sips/123")
            )) 
        }

        if (isRefreshing) {
            LaunchedEffect(true) {
                delay(1500)
                isRefreshing = false
            }
        }

        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { isRefreshing = true },
            state = pullRefreshState,
            modifier = Modifier.fillMaxSize()
        ) {
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
                            onClick = { navigator.push(EditProfileScreen()) }, 
                            modifier = Modifier.weight(1f).height(44.dp),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.SurfaceVariant, contentColor = KrietaColors.OnSurface)
                        ) {
                            Text("Edit Profile", fontWeight = FontWeight.SemiBold)
                        }
                        Button(
                            onClick = { navigator.push(WalletScreen()) }, 
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
                    Row(
                        modifier = Modifier.clickable { navigator.push(MilestonesScreen()) },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🎯 Milestones", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = KrietaColors.PrimaryLight)
                    }
                    Row(
                        modifier = Modifier.clickable { showBioLinkSheet = true },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🔗 Bio Link", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = KrietaColors.PrimaryLight)
                    }
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

        if (showBioLinkSheet) {
            BioLinkBottomSheet(
                isOwnProfile = isOwnProfile,
                links = bioLinks,
                onDismiss = { showBioLinkSheet = false },
                onAddLink = { title, url -> 
                    bioLinks = bioLinks + BioLink(
                        id = (bioLinks.size + 1).toString(), 
                        title = title, 
                        url = url
                    ) 
                },
                onDeleteLink = { id -> bioLinks = bioLinks.filter { it.id != id } }
            )
        }
    }
}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BioLinkBottomSheet(
    isOwnProfile: Boolean,
    links: List<BioLink>,
    onDismiss: () -> Unit,
    onAddLink: (String, String) -> Unit,
    onDeleteLink: (String) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var showAddLinkField by remember { mutableStateOf(false) }
    var newTitle by remember { mutableStateOf("") }
    var newUrl by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = KrietaColors.BackgroundElevated,
        dragHandle = { BottomSheetDefaults.DragHandle(color = KrietaColors.OnSurfaceVariant.copy(alpha = 0.4f)) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 48.dp)
        ) {
            Box(modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)) {
                Text(
                    text = if (isOwnProfile) "Manage Bio Links" else "Connect with Me",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = KrietaColors.OnSurface,
                    modifier = Modifier.align(Alignment.CenterStart)
                )
                if (isOwnProfile && !showAddLinkField) {
                    IconButton(
                        onClick = { showAddLinkField = true },
                        modifier = Modifier.align(Alignment.CenterEnd).background(KrietaColors.Primary.copy(alpha = 0.1f), CircleShape)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add", tint = KrietaColors.Primary)
                    }
                }
            }

            if (links.isEmpty() && !showAddLinkField) {
                Text(
                    "No links added yet.",
                    color = KrietaColors.OnSurfaceVariant,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp),
                    textAlign = TextAlign.Center
                )
            }

            links.forEach { link ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .clickable { /* External Navigation logic */ },
                    color = KrietaColors.SurfaceVariant,
                    border = BorderStroke(1.dp, KrietaColors.Outline.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = link.title, 
                                fontWeight = FontWeight.Bold, 
                                fontSize = 16.sp,
                                color = KrietaColors.OnSurface
                            )
                            Text(
                                text = link.url, 
                                fontSize = 12.sp, 
                                color = KrietaColors.Primary.copy(alpha = 0.8f),
                                maxLines = 1,
                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                            )
                        }
                        
                        if (isOwnProfile) {
                            IconButton(onClick = { onDeleteLink(link.id) }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Red.copy(alpha = 0.6f))
                            }
                        } else {
                            Icon(
                                imageVector = Icons.Default.List, // Placeholder for external link icon
                                contentDescription = "Visit",
                                tint = KrietaColors.OnSurfaceVariant,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            if (isOwnProfile && showAddLinkField) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp)
                        .background(KrietaColors.Surface, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Text("Add New Link", fontWeight = FontWeight.Bold, color = KrietaColors.Primary)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    OutlinedTextField(
                        value = newTitle,
                        onValueChange = { newTitle = it },
                        label = { Text("Title (e.g. My Website)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = KrietaColors.Primary,
                            unfocusedBorderColor = KrietaColors.Outline
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = newUrl,
                        onValueChange = { newUrl = it },
                        label = { Text("URL (https://...)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = KrietaColors.Primary,
                            unfocusedBorderColor = KrietaColors.Outline
                        )
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextButton(
                            onClick = { showAddLinkField = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancel", color = KrietaColors.OnSurfaceVariant)
                        }
                        Button(
                            onClick = {
                                if (newTitle.isNotBlank() && newUrl.isNotBlank()) {
                                    onAddLink(newTitle, newUrl)
                                    newTitle = ""
                                    newUrl = ""
                                    showAddLinkField = false
                                }
                            },
                            modifier = Modifier.weight(2f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.Primary)
                        ) {
                            Text("Save Link", color = KrietaColors.Background, fontWeight = FontWeight.Bold)
                        }
                    }
                }
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

