package com.krieta.feature.profile.presentation.screen

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll

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
import cafe.adriel.voyager.koin.koinScreenModel
import org.koin.core.parameter.parametersOf
import com.krieta.feature.profile.presentation.viewmodel.ProfileViewModel
import com.krieta.feature.profile.presentation.viewmodel.BioLinksViewModel
import com.krieta.feature.profile.domain.model.BioLink
import com.krieta.feature.profile.presentation.screen.MilestonesScreen
import com.krieta.feature.profile.presentation.screen.EditProfileScreen
import com.krieta.feature.wallet.presentation.screen.WalletScreen
import com.krieta.com.core.theme.KrietaColors
import androidx.compose.ui.platform.LocalUriHandler
import com.krieta.feature.auth.presentation.screen.LoginScreen
import androidx.compose.foundation.BorderStroke

class ProfileScreen(val userId: String? = null) : Screen {
    override val key: cafe.adriel.voyager.core.screen.ScreenKey = "ProfileScreen:${userId ?: "me"}"
    
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val profileViewModel = koinScreenModel<ProfileViewModel> { parametersOf(userId) }
        val bioLinksViewModel = koinScreenModel<BioLinksViewModel>()
        
        val profileState by profileViewModel.state.collectAsState()
        val bioLinksState by bioLinksViewModel.state.collectAsState()

        var menuExpanded by remember { mutableStateOf(false) }
        var showBioLinkSheet by remember { mutableStateOf(false) }
        
        val isOwnProfile = profileViewModel.isOwnProfile
        
        val profile = profileState.profile
        val isLoading = profileState.isLoading
        val error = profileState.error
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = KrietaColors.Primary)
            }
        } else if (error != null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                    Text("😕", fontSize = 48.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        error, 
                        color = KrietaColors.Error,
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = { profileViewModel.refreshProfile() },
                        colors = ButtonDefaults.buttonColors(containerColor = KrietaColors.Primary)
                    ) { 
                        Text("Retry", color = KrietaColors.OnPrimary) 
                    }
                }
            }
        } else if (profile != null) {
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
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 48.dp, end = 16.dp, start = 16.dp, bottom = 16.dp),
                            horizontalArrangement = Arrangement.End
                        ) {
                            if (isOwnProfile) {
                                Box {
                                    IconButton(onClick = { menuExpanded = true }) {
                                        Icon(painterResource(Res.drawable.ic_more_vert), contentDescription = "Menu", tint = KrietaColors.OnBackground)
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
                                        DropdownMenuItem(
                                            text = { Text("Log Out", color = Color.Red) },
                                            onClick = {
                                                menuExpanded = false
                                                profileViewModel.logout {
                                                    navigator.replaceAll(LoginScreen())
                                                }
                                            }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("Wipe Local Cache", color = Color.Red) },
                                            onClick = {
                                                menuExpanded = false
                                                profileViewModel.wipeCache {
                                                    navigator.replaceAll(LoginScreen())
                                                }
                                            }
                                        )
                                    }
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
                                Text(profile.username.firstOrNull()?.uppercase() ?: "?", fontSize = 36.sp, color = KrietaColors.Primary)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // User Info
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            profile.displayName, 
                            fontWeight = FontWeight.Bold, 
                            fontSize = 22.sp, 
                            color = KrietaColors.OnBackground
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        // Account Type Badge
                        val isCreator = profile.accountType.name == "CREATOR"
                        val badgeText = if (isCreator) "★ Creator" else "💼 Business"
                        Box(
                            modifier = Modifier
                                .border(1.dp, KrietaColors.PrimaryDark, RoundedCornerShape(12.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(badgeText, fontSize = 10.sp, color = KrietaColors.Primary)
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text("@${profile.username}", fontSize = 14.sp, color = KrietaColors.OnSurfaceVariant)
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        profile.bio ?: "No bio yet", 
                        fontSize = 14.sp, 
                        color = KrietaColors.OnSurface,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 24.dp)
                    )
                    
                    // Niches
                    if (profile.selectedNiches.isNotEmpty() || profile.customNiches.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            androidx.compose.foundation.layout.FlowRow(
                                horizontalArrangement = Arrangement.Center,
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                (profile.selectedNiches + profile.customNiches).forEach { niche ->
                                    Box(
                                        modifier = Modifier
                                            .padding(horizontal = 4.dp)
                                            .background(KrietaColors.Primary.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                                            .border(1.dp, KrietaColors.Primary.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                                            .padding(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text(
                                            niche,
                                            fontSize = 12.sp,
                                            color = KrietaColors.Primary,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Social Stats (Admirers, Admiring)
                    Spacer(modifier = Modifier.height(20.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AnalyticsStat(
                            count = "${profile.stats.admirers}", 
                            label = "Admirers", 
                            modifier = Modifier.clickable { navigator.push(com.krieta.feature.profile.presentation.screen.SocialListScreen(userId = profile.id, title = "Admirers")) }.padding(8.dp)
                        )
                        Spacer(modifier = Modifier.width(32.dp))
                        AnalyticsStat(
                            count = "${profile.stats.admiring}", 
                            label = "Admiring", 
                            modifier = Modifier.clickable { navigator.push(com.krieta.feature.profile.presentation.screen.SocialListScreen(userId = profile.id, title = "Admiring")) }.padding(8.dp)
                        )
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
                            val relationship = profile.relationshipStatus
                            
                            val buttonText = when (relationship.name) {
                                "ADMIRING" -> "Unadmire"
                                "ADMIRED_BY" -> "Love"
                                "LOVERS" -> "Unlove"
                                else -> "Admire"
                            }
                            
                            val isActionPositive = relationship.name == "NONE" || relationship.name == "ADMIRED_BY"
                            
                            Button(
                                onClick = { profileViewModel.toggleAdmire() }, 
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isActionPositive) KrietaColors.Accent else KrietaColors.SurfaceVariant, 
                                    contentColor = if (isActionPositive) KrietaColors.OnAccent else KrietaColors.OnSurface
                                )
                            ) {
                                if (profileState.isRelationshipLoading) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = KrietaColors.OnBackground)
                                } else {
                                    Text(buttonText, fontWeight = FontWeight.SemiBold)
                                }
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
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    if (isOwnProfile) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(KrietaColors.Primary.copy(alpha = 0.1f))
                                .clickable { navigator.push(MilestonesScreen()) }
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("🎯 Milestones", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = KrietaColors.PrimaryLight)
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                    }
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(KrietaColors.Primary.copy(alpha = 0.1f))
                            .clickable { showBioLinkSheet = true }
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🔗 Bio Link", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = KrietaColors.PrimaryLight)
                    }
                }

                // Tabs Configuration (No Grid requested)
                Spacer(modifier = Modifier.height(24.dp))
                var selectedTab by remember { mutableStateOf(0) }
                PrimaryTabRow(
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
                Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }

        if (showBioLinkSheet) {
            BioLinkBottomSheet(
                isOwnProfile = isOwnProfile,
                links = if (isOwnProfile) bioLinksState.links else profile?.bioLinks ?: emptyList(),
                onDismiss = { showBioLinkSheet = false },
                onAddLink = { label, url -> bioLinksViewModel.addLink(label, url) },
                onDeleteLink = { id -> bioLinksViewModel.deleteLink(id) }
            )
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
    val sheetState = rememberModalBottomSheetState()
    var showAddLinkField by remember { mutableStateOf(false) }
    var newTitle by remember { mutableStateOf("") }
    var newUrl by remember { mutableStateOf("") }
    val uriHandler = LocalUriHandler.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = KrietaColors.BackgroundElevated,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
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
                        Icon(painterResource(Res.drawable.ic_add), contentDescription = "Add", tint = KrietaColors.Primary)
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
                        .clickable {
                        val url = link.url.let { u ->
                            if (u.startsWith("http://") || u.startsWith("https://")) u
                            else "https://$u"
                        }
                        try { uriHandler.openUri(url) } catch (_: Exception) {}
                    },
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
                                text = link.label, 
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
                                Icon(painterResource(Res.drawable.ic_delete), contentDescription = "Delete", tint = Color.Red.copy(alpha = 0.6f))
                            }
                        } else {
                            Icon(
                                painter = painterResource(Res.drawable.ic_list),
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
                        label = { Text("Title (e.g. My Website)", color = KrietaColors.OnSurfaceVariant) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = KrietaColors.Primary,
                            unfocusedBorderColor = KrietaColors.Outline,
                            focusedTextColor = KrietaColors.OnBackground,
                            unfocusedTextColor = KrietaColors.OnBackground,
                            cursorColor = KrietaColors.Primary,
                            focusedLabelColor = KrietaColors.Primary,
                            unfocusedLabelColor = KrietaColors.OnSurfaceVariant
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = newUrl,
                        onValueChange = { newUrl = it },
                        label = { Text("URL (https://...)", color = KrietaColors.OnSurfaceVariant) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = KrietaColors.Primary,
                            unfocusedBorderColor = KrietaColors.Outline,
                            focusedTextColor = KrietaColors.OnBackground,
                            unfocusedTextColor = KrietaColors.OnBackground,
                            cursorColor = KrietaColors.Primary,
                            focusedLabelColor = KrietaColors.Primary,
                            unfocusedLabelColor = KrietaColors.OnSurfaceVariant
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
private fun AnalyticsStat(count: String, label: String, modifier: Modifier = Modifier) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Text(count, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = KrietaColors.OnBackground)
        Text(label, fontSize = 13.sp, color = KrietaColors.OnSurfaceVariant)
    }
}

