package com.runinga.feature.profile.presentation.screen

import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import cafe.adriel.voyager.core.screen.Screen
import coil3.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import cafe.adriel.voyager.navigator.Navigator
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll

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
import cafe.adriel.voyager.koin.koinScreenModel
import com.runinga.feature.profile.presentation.viewmodel.ProfileViewModel
import com.runinga.feature.profile.presentation.viewmodel.BioLinksViewModel
import com.runinga.feature.profile.domain.model.BioLink
import com.runinga.feature.wallet.presentation.screen.WalletScreen
import com.runinga.com.core.theme.RuningaColors
import androidx.compose.ui.platform.LocalUriHandler
import com.runinga.feature.auth.presentation.screen.LoginScreen
import androidx.compose.foundation.BorderStroke
import org.koin.core.parameter.parametersOf
import org.koin.compose.koinInject
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush


class ProfileScreen(val userId: String? = null) : Screen {
    override val key = "ProfileScreen:${userId ?: "me"}"
    
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        // Find root navigator by traversing up the hierarchy
        var rootNavigator = navigator
        while (rootNavigator.parent != null) {
            rootNavigator = rootNavigator.parent!!
        }
        val profileViewModel = koinScreenModel<ProfileViewModel> { parametersOf(userId) }
        val bioLinksViewModel = koinScreenModel<BioLinksViewModel>()
        val chatRepository = koinInject<com.runinga.feature.chat.domain.repository.ChatRepository>()
        val scope = rememberCoroutineScope()
        
        val profileState by profileViewModel.state.collectAsState()
        val bioLinksState by bioLinksViewModel.state.collectAsState()

        var menuExpanded by remember { mutableStateOf(false) }
        var showBioLinkSheet by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }
        var showFullScreenImage by remember { mutableStateOf(false) }
        var fullScreenImageUrl by remember { mutableStateOf<String?>(null) }
        
        val isOwnProfile = profileViewModel.isOwnProfile
        
        val profile = profileState.profile
        val isLoading = profileState.isLoading
        val error = profileState.error

        // Handle navigation events
        LaunchedEffect(Unit) {
            profileViewModel.navigationEvents.collectLatest { event ->
                when (event) {
                    is com.runinga.feature.profile.presentation.viewmodel.ProfileViewModel.NavigationEvent.OpenChat -> {
                        navigator.push(com.runinga.feature.chat.presentation.room.ChatRoomScreen(event.chatId, ""))
                    }
                    is com.runinga.feature.profile.presentation.viewmodel.ProfileViewModel.NavigationEvent.ShowError -> {
                        errorMessage = event.message
                    }
                }
            }
        }
        

        
        if (isLoading && profile == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = RuningaColors.Primary)
            }
        } else if (error != null && profile == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                    Text("😕", fontSize = 48.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        error, 
                        color = RuningaColors.Error,
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = { profileViewModel.refreshProfile() },
                        colors = ButtonDefaults.buttonColors(containerColor = RuningaColors.Primary)
                    ) { 
                        Text("Retry", color = RuningaColors.OnPrimary) 
                    }
                }
            }
        } else if (profile != null) {
            val snackbarHostState = remember { SnackbarHostState() }
            val scrollState = rememberScrollState()
            var pullOffset by remember { mutableStateOf(0f) }
            
            val nestedScrollConnection = remember {
                object : NestedScrollConnection {
                    override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                        if (pullOffset > 0f && available.y < 0f) {
                            val consumed = available.y.coerceAtLeast(-pullOffset)
                            pullOffset += consumed
                            return Offset(0f, consumed)
                        }
                        return Offset.Zero
                    }

                    override fun onPostScroll(
                        consumed: Offset,
                        available: Offset,
                        source: NestedScrollSource
                    ): Offset {
                        if (scrollState.value == 0 && available.y > 0f) {
                            pullOffset += available.y * 0.5f
                            return Offset(0f, available.y)
                        }
                        return Offset.Zero
                    }

                    override suspend fun onPreFling(available: Velocity): Velocity {
                        if (pullOffset > 0f) {
                            animate(
                                initialValue = pullOffset,
                                targetValue = 0f,
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioMediumBouncy,
                                    stiffness = Spring.StiffnessMediumLow
                                )
                            ) { value, _ ->
                                pullOffset = value
                            }
                        }
                        return Velocity.Zero
                    }
                }
            }
            
            // Show error snackbar
            LaunchedEffect(errorMessage) {
                errorMessage?.let { msg ->
                    snackbarHostState.showSnackbar(
                        message = msg,
                        duration = SnackbarDuration.Short
                    )
                    errorMessage = null
                }
            }
            
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(RuningaColors.Background)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .nestedScroll(nestedScrollConnection)
                        .verticalScroll(scrollState),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Header Area with Cover Image
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp + (pullOffset / 2f).dp),
                        contentAlignment = Alignment.TopCenter
                    ) {
                        // Cover Banner - Display user banner or fallback
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable(enabled = profile.coverPhotoUrl != null) {
                                    fullScreenImageUrl = profile.coverPhotoUrl
                                    showFullScreenImage = true
                                }
                        ) {
                            if (profile.coverPhotoUrl != null) {
                                AsyncImage(
                                    model = profile.coverPhotoUrl,
                                    contentDescription = "Cover photo",
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .graphicsLayer {
                                            if (scrollState.value > 0) {
                                                translationY = scrollState.value * 0.5f
                                                scaleX = 1f + (scrollState.value * 0.0005f).coerceAtMost(0.1f)
                                                scaleY = 1f + (scrollState.value * 0.0005f).coerceAtMost(0.1f)
                                            } else if (pullOffset > 0f) {
                                                val scaleFactor = 1f + (pullOffset / 400f)
                                                scaleX = scaleFactor
                                                scaleY = scaleFactor
                                            }
                                        },
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(
                                            Brush.verticalGradient(
                                                colors = listOf(
                                                    RuningaColors.Primary.copy(alpha = 0.2f),
                                                    RuningaColors.BackgroundElevated
                                                )
                                            )
                                        )
                                )
                            }
                            
                            // Bottom fade
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(60.dp)
                                    .align(Alignment.BottomCenter)
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(
                                                Color.Transparent,
                                                RuningaColors.Background
                                            )
                                        )
                                    )
                            )
                        }
                        
                        // Top App Bar / Actions over Cover
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(80.dp)
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(
                                            Color.Black.copy(alpha = 0.4f),
                                            Color.Transparent
                                        )
                                    )
                                )
                        )
                        
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 12.dp, end = 16.dp, start = 16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (!isOwnProfile) {
                                IconButton(
                                    onClick = { navigator.pop() },
                                    modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                                ) {
                                    Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back", tint = Color.White)
                                }
                            } else {
                                Spacer(Modifier.width(48.dp))
                            }
                            if (isOwnProfile) {
                                Box {
                                    IconButton(
                                        onClick = { menuExpanded = true },
                                        modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                                    ) {
                                        Icon(painterResource(Res.drawable.ic_more_vert), contentDescription = "Menu", tint = Color.White)
                                    }
                                    DropdownMenu(
                                        expanded = menuExpanded,
                                        onDismissRequest = { menuExpanded = false },
                                        modifier = Modifier.background(RuningaColors.SurfaceVariant)
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("Profile Views", color = RuningaColors.OnSurface) },
                                            onClick = { menuExpanded = false }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("Analytics", color = RuningaColors.OnSurface) },
                                            onClick = { menuExpanded = false }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("Log Out", color = Color.Red) },
                                            onClick = {
                                                menuExpanded = false
                                                profileViewModel.logout {
                                                    rootNavigator.replaceAll(LoginScreen())
                                                }
                                            }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("Wipe Local Cache", color = Color.Red) },
                                            onClick = {
                                                menuExpanded = false
                                                profileViewModel.wipeCache {
                                                    rootNavigator.replaceAll(LoginScreen())
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Profile Details Card Container (Floating Card overlapping cover banner)
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .offset(y = (-40).dp)
                            .shadow(12.dp, RoundedCornerShape(24.dp)),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = RuningaColors.BackgroundElevated),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp)
                        ) {
                            // Avatar, Display Name, and Verified Badge row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Avatar
                                Box(
                                    modifier = Modifier
                                        .size(88.dp)
                                        .clip(CircleShape)
                                        .background(RuningaColors.Background)
                                        .clickable(enabled = profile.avatarUrl != null) {
                                            fullScreenImageUrl = profile.avatarUrl
                                            showFullScreenImage = true
                                        }
                                ) {
                                    if (profile.avatarUrl != null) {
                                        AsyncImage(
                                            model = profile.avatarUrl,
                                            contentDescription = "${profile.displayName}'s avatar",
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(CircleShape)
                                                .border(2.dp, RuningaColors.Primary, CircleShape),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(CircleShape)
                                                .background(RuningaColors.SurfaceVariant)
                                                .border(2.dp, RuningaColors.Primary, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                profile.username.firstOrNull()?.uppercase() ?: "?",
                                                fontSize = 32.sp,
                                                color = RuningaColors.Primary,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.width(16.dp))

                                // User Details stack
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = profile.displayName,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 20.sp,
                                            color = RuningaColors.OnBackground,
                                            maxLines = 1,
                                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                        )
                                        if (profile.isVerified) {
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Icon(
                                                painter = painterResource(Res.drawable.ic_verified),
                                                contentDescription = "Verified",
                                                tint = RuningaColors.Primary,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "@${profile.username}",
                                        fontSize = 14.sp,
                                        color = RuningaColors.OnSurfaceVariant
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))
                                    // Account Type Badge
                                    val isCreator = profile.accountType.name == "CREATOR"
                                    val badgeText = if (isCreator) "★ Creator" else "💼 Business"
                                    Box(
                                        modifier = Modifier
                                            .background(RuningaColors.Primary, RoundedCornerShape(8.dp))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = badgeText,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = RuningaColors.OnPrimary
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Bio
                            Text(
                                text = profile.bio ?: "No bio yet",
                                fontSize = 14.sp,
                                color = RuningaColors.OnSurface,
                                modifier = Modifier.fillMaxWidth()
                            )

                            // Niches
                            if (profile.selectedNiches.isNotEmpty() || profile.customNiches.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(14.dp))
                                androidx.compose.foundation.layout.FlowRow(
                                    horizontalArrangement = Arrangement.Start,
                                    verticalArrangement = Arrangement.spacedBy(6.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    (profile.selectedNiches + profile.customNiches).forEach { niche ->
                                        Box(
                                            modifier = Modifier
                                                .padding(end = 6.dp)
                                                .background(RuningaColors.Primary.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                                                .border(1.dp, RuningaColors.Primary.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                                .padding(horizontal = 10.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                text = niche,
                                                fontSize = 11.sp,
                                                color = RuningaColors.Primary,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                    }
                                }
                            }

                            HorizontalDivider(
                                modifier = Modifier.padding(vertical = 16.dp),
                                color = Color.White.copy(alpha = 0.06f),
                                thickness = 1.dp
                            )

                            // 4-Column Stats Dashboard
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Column 1: Admirers
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            navigator.push(SocialListScreen(userId = profile.id, title = "Admirers"))
                                        }
                                        .padding(vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "${profile.stats.admirers}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        color = RuningaColors.OnBackground
                                    )
                                    Text(
                                        text = "Admirers",
                                        fontSize = 11.sp,
                                        color = RuningaColors.OnSurfaceVariant
                                    )
                                }

                                Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color.White.copy(alpha = 0.08f)))

                                // Column 2: Admiring
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            navigator.push(SocialListScreen(userId = profile.id, title = "Admiring"))
                                        }
                                        .padding(vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "${profile.stats.admiring}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        color = RuningaColors.OnBackground
                                    )
                                    Text(
                                        text = "Admiring",
                                        fontSize = 11.sp,
                                        color = RuningaColors.OnSurfaceVariant
                                    )
                                }

                                Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color.White.copy(alpha = 0.08f)))

                                // Column 3: Lovers
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            navigator.push(SocialListScreen(userId = profile.id, title = "Lovers"))
                                        }
                                        .padding(vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "${profile.stats.lovers}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        color = RuningaColors.OnBackground
                                    )
                                    Text(
                                        text = "Lovers",
                                        fontSize = 11.sp,
                                        color = RuningaColors.OnSurfaceVariant
                                    )
                                }

                                Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color.White.copy(alpha = 0.08f)))

                                // Column 4: Contests Won
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "${profile.stats.contestsWon}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        color = RuningaColors.OnBackground
                                    )
                                    Text(
                                        text = "Won",
                                        fontSize = 11.sp,
                                        color = RuningaColors.OnSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    // Content layout flow shifted vertically to match card offset
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .offset(y = (-40).dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Action buttons
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            if (isOwnProfile) {
                                Button(
                                    onClick = { navigator.push(EditProfileScreen()) },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(46.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = RuningaColors.SurfaceVariant,
                                        contentColor = RuningaColors.OnSurface
                                    )
                                ) {
                                    Text("Edit Profile", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                                Button(
                                    onClick = { navigator.push(WalletScreen()) },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(46.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = RuningaColors.Primary,
                                        contentColor = RuningaColors.OnPrimary
                                    )
                                ) {
                                    Text("Wallet", fontWeight = FontWeight.Bold, fontSize = 14.sp)
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
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(46.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isActionPositive) RuningaColors.Accent else RuningaColors.SurfaceVariant,
                                        contentColor = if (isActionPositive) RuningaColors.OnAccent else RuningaColors.OnSurface
                                    )
                                ) {
                                    if (profileState.isRelationshipLoading) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp,
                                            color = RuningaColors.OnBackground
                                        )
                                    } else {
                                        Text(buttonText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    }
                                }
                                Button(
                                    onClick = { profileViewModel.initiateChat(chatRepository) },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(46.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = RuningaColors.SurfaceVariant,
                                        contentColor = RuningaColors.OnSurface
                                    )
                                ) {
                                    Text("Message", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            }
                        }

                        // Milestones and Bio Link Section
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            if (isOwnProfile) {
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .clickable { navigator.push(MilestonesScreen()) },
                                    color = RuningaColors.Surface,
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.06f))
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxSize(),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            painter = painterResource(Res.drawable.ic_emoji_events),
                                            contentDescription = null,
                                            tint = RuningaColors.Primary,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Milestones",
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = RuningaColors.OnSurface
                                        )
                                    }
                                }
                            }
                            
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .clickable { showBioLinkSheet = true },
                                color = RuningaColors.Surface,
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.06f))
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxSize(),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        painter = painterResource(Res.drawable.ic_link),
                                        contentDescription = null,
                                        tint = RuningaColors.Primary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Bio Links",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = RuningaColors.OnSurface
                                    )
                                }
                            }
                        }

                        // Tabs Configuration
                        Spacer(modifier = Modifier.height(24.dp))
                        var selectedTab by remember { mutableStateOf(0) }
                        val tabs = listOf("Videos", "Contests", "Liked")
                        
                        HorizontalDivider(
                            modifier = Modifier.fillMaxWidth(),
                            thickness = 1.dp,
                            color = Color.White.copy(alpha = 0.06f)
                        )
                        
                        TabRow(
                            selectedTabIndex = selectedTab,
                            containerColor = RuningaColors.Background,
                            contentColor = RuningaColors.Primary,
                            indicator = { /* No default underline indicator */ },
                            divider = { /* No divider */ }
                        ) {
                            tabs.forEachIndexed { index, title ->
                                val isSelected = selectedTab == index
                                val tabIcon = when (index) {
                                    0 -> Res.drawable.ic_videocam
                                    1 -> Res.drawable.ic_emoji_events
                                    else -> Res.drawable.ic_favorite
                                }
                                
                                Tab(
                                    selected = isSelected,
                                    onClick = { selectedTab = index },
                                    modifier = Modifier
                                        .padding(horizontal = 6.dp, vertical = 8.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(
                                            if (isSelected) RuningaColors.Primary.copy(alpha = 0.08f)
                                            else Color.Transparent
                                        )
                                        .border(
                                            1.dp,
                                            if (isSelected) RuningaColors.Primary.copy(alpha = 0.2f)
                                            else Color.Transparent,
                                            RoundedCornerShape(16.dp)
                                        )
                                        .height(40.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center,
                                        modifier = Modifier.padding(horizontal = 12.dp)
                                    ) {
                                        Icon(
                                            painter = painterResource(tabIcon),
                                            contentDescription = null,
                                            tint = if (isSelected) RuningaColors.Primary else RuningaColors.OnSurfaceVariant,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = title,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = if (isSelected) RuningaColors.Primary else RuningaColors.OnSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }

                        // Tab Content - Premium empty states
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            when (selectedTab) {
                                0 -> TabEmptyState(
                                    icon = Res.drawable.ic_videocam,
                                    title = "No Videos Yet",
                                    description = if (isOwnProfile) "Upload short videos to showcase your talent, engage with fans, and monetize your content!" else "This creator hasn't uploaded any videos yet.",
                                    buttonText = if (isOwnProfile) "Upload Video" else null,
                                    onButtonClick = { /* Implement video upload trigger */ }
                                )
                                1 -> TabEmptyState(
                                    icon = Res.drawable.ic_emoji_events,
                                    title = "No Contests Entered",
                                    description = if (isOwnProfile) "Join live contests, compete with other creators, win cash prizes, and build your reputation!" else "This user hasn't participated in any contests yet.",
                                    buttonText = "Explore Contests",
                                    onButtonClick = {
                                        navigator.push(com.runinga.feature.contests.presentation.screen.ContestFeedScreen())
                                    }
                                )
                                2 -> TabEmptyState(
                                    icon = Res.drawable.ic_favorite,
                                    title = "No Liked Content",
                                    description = if (isOwnProfile) "Content you admire or love across the platform will appear here in your private archive." else "Liked contents are kept private.",
                                    buttonText = "Browse Feed",
                                    onButtonClick = {
                                        rootNavigator.replaceAll(com.runinga.feature.feed.presentation.screen.HomeScreen())
                                    }
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(100.dp))
                    }
                }
                
                // Snackbar host
                SnackbarHost(
                    hostState = snackbarHostState,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 16.dp)
                )
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
        
        if (showFullScreenImage && fullScreenImageUrl != null) {
            FullScreenImageViewer(
                imageUrl = fullScreenImageUrl!!,
                onDismiss = { 
                    showFullScreenImage = false
                    fullScreenImageUrl = null
                }
            )
        }
    }
}

@Composable
private fun FullScreenImageViewer(imageUrl: String, onDismiss: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .clickable { onDismiss() },
        contentAlignment = Alignment.Center
    ) {
        AsyncImage(
            model = imageUrl,
            contentDescription = "Full screen image",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Fit
        )
        
        IconButton(
            onClick = onDismiss,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
        ) {
            Icon(
                painterResource(Res.drawable.ic_close),
                contentDescription = "Close",
                tint = Color.White
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
        containerColor = RuningaColors.BackgroundElevated,
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
                    color = RuningaColors.OnSurface,
                    modifier = Modifier.align(Alignment.CenterStart)
                )
                if (isOwnProfile && !showAddLinkField) {
                    IconButton(
                        onClick = { showAddLinkField = true },
                        modifier = Modifier.align(Alignment.CenterEnd).background(RuningaColors.Primary.copy(alpha = 0.1f), CircleShape)
                    ) {
                        Icon(painterResource(Res.drawable.ic_add), contentDescription = "Add", tint = RuningaColors.Primary)
                    }
                }
            }

            if (links.isEmpty() && !showAddLinkField) {
                Text(
                    "No links added yet.",
                    color = RuningaColors.OnSurfaceVariant,
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
                        try {
                            val url = if (link.url.startsWith("http://") || link.url.startsWith("https://")) {
                                link.url
                            } else {
                                "https://${link.url}"
                            }
                            uriHandler.openUri(url)
                        } catch (_: Exception) {}
                    },
                    color = RuningaColors.SurfaceVariant,
                    border = BorderStroke(1.dp, RuningaColors.Outline.copy(alpha = 0.5f)),
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
                                color = RuningaColors.OnSurface
                            )
                            Text(
                                text = link.url, 
                                fontSize = 12.sp, 
                                color = RuningaColors.Primary.copy(alpha = 0.8f),
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
                                tint = RuningaColors.OnSurfaceVariant,
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
                        .background(RuningaColors.Surface, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Text("Add New Link", fontWeight = FontWeight.Bold, color = RuningaColors.Primary)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    OutlinedTextField(
                        value = newTitle,
                        onValueChange = { newTitle = it },
                        label = { Text("Title (e.g. My Website)", color = RuningaColors.OnSurfaceVariant) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = RuningaColors.Primary,
                            unfocusedBorderColor = RuningaColors.Outline,
                            focusedTextColor = RuningaColors.OnBackground,
                            unfocusedTextColor = RuningaColors.OnBackground,
                            cursorColor = RuningaColors.Primary,
                            focusedLabelColor = RuningaColors.Primary,
                            unfocusedLabelColor = RuningaColors.OnSurfaceVariant
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = newUrl,
                        onValueChange = { newUrl = it },
                        label = { Text("URL (https://...)", color = RuningaColors.OnSurfaceVariant) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = RuningaColors.Primary,
                            unfocusedBorderColor = RuningaColors.Outline,
                            focusedTextColor = RuningaColors.OnBackground,
                            unfocusedTextColor = RuningaColors.OnBackground,
                            cursorColor = RuningaColors.Primary,
                            focusedLabelColor = RuningaColors.Primary,
                            unfocusedLabelColor = RuningaColors.OnSurfaceVariant
                        )
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextButton(
                            onClick = { showAddLinkField = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancel", color = RuningaColors.OnSurfaceVariant)
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
                            colors = ButtonDefaults.buttonColors(containerColor = RuningaColors.Primary)
                        ) {
                            Text("Save Link", color = RuningaColors.Background, fontWeight = FontWeight.Bold)
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
        Text(count, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = RuningaColors.OnBackground)
        Text(label, fontSize = 13.sp, color = RuningaColors.OnSurfaceVariant)
    }
}

@Composable
private fun TabEmptyState(
    icon: org.jetbrains.compose.resources.DrawableResource,
    title: String,
    description: String,
    buttonText: String? = null,
    onButtonClick: (() -> Unit)? = null
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.02f))
                .border(1.dp, Color.White.copy(alpha = 0.05f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                painter = painterResource(icon),
                contentDescription = null,
                tint = RuningaColors.OnSurfaceVariant.copy(alpha = 0.4f),
                modifier = Modifier.size(28.dp)
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = RuningaColors.OnBackground,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = description,
            style = MaterialTheme.typography.bodyMedium,
            color = RuningaColors.OnSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 24.dp)
        )
        
        if (buttonText != null && onButtonClick != null) {
            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = onButtonClick,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = RuningaColors.Primary.copy(alpha = 0.15f),
                    contentColor = RuningaColors.Primary
                ),
                border = BorderStroke(1.dp, RuningaColors.Primary.copy(alpha = 0.3f)),
                modifier = Modifier.height(40.dp)
            ) {
                Text(
                    text = buttonText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }
        }
    }
}


