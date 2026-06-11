package com.krieta.feature.feed.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.gestures.detectTransformGestures

import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.feature.comments.domain.model.ContentType
import com.krieta.feature.comments.presentation.screen.CommentsScreen
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.ui.components.TippingModal
import com.krieta.feature.wallet.presentation.viewmodel.WalletViewModel
import com.krieta.feature.wallet.presentation.viewmodel.WalletState
import com.krieta.feature.wallet.domain.repository.WalletRepository
import kotlinx.coroutines.launch
import org.koin.compose.koinInject
import com.krieta.feature.feed.domain.model.Post
import com.krieta.feature.feed.presentation.viewmodel.FeedViewModel
import com.krieta.com.core.upload.UploadCompletionNotifier
import com.krieta.com.core.upload.UploadType
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import com.krieta.feature.profile.presentation.screen.ProfileScreen
import com.krieta.feature.profile.domain.repository.ProfileRepository
import androidx.compose.foundation.border
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.SolidColor

class DripsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<FeedViewModel>()
        val walletViewModel = koinScreenModel<WalletViewModel>()
        val walletRepository = koinInject<WalletRepository>()
        val profileRepository = koinInject<ProfileRepository>()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val tokenManager = koinInject<com.krieta.com.core.security.TokenManager>()
        val scope = rememberCoroutineScope()
        
        val state by viewModel.state.collectAsState()
        val walletState by walletViewModel.state.collectAsState()
        val currentBalance = (walletState as? WalletState.Success)?.balance?.krBalance ?: 0.0

        var showTippingFor by remember { mutableStateOf<Post?>(null) }
        var currentUserId by remember { mutableStateOf<String?>(null) }
        var showImageViewer by remember { mutableStateOf(false) }
        var pendingCommentPost by remember { mutableStateOf<Post?>(null) }
        var selectedImages by remember { mutableStateOf<List<String>>(emptyList()) }
        var selectedImageIndex by remember { mutableStateOf(0) }
        
        LaunchedEffect(Unit) {
            currentUserId = tokenManager.getUserId()
            // If a comment was tapped before userId loaded, navigate now
            pendingCommentPost?.let { post ->
                currentUserId?.let { userId ->
                    navigator.push(CommentsScreen(ContentType.POST, post.id, userId))
                    pendingCommentPost = null
                }
            }
            currencyProvider.start()
            kotlinx.coroutines.delay(500)
            walletViewModel.fetchWalletData(currencyProvider.countryCode)
            
            UploadCompletionNotifier.uploadCompletions
                .onEach { event ->
                    if (event.success && event.type == UploadType.DRIP) {
                        // Optimistic update: add the new post immediately instead of full refresh
                        if (event.contentId.isNotEmpty()) {
                            viewModel.addNewPost(event.contentId)
                        } else {
                            // Fallback to refresh if no contentId
                            viewModel.refresh()
                        }
                    } else if (!event.success && event.type == UploadType.DRIP) {
                        // Log failed upload for error recovery
                        println("Error Recovery: Post upload failed - ID: ${event.contentId}")
                    }
                }
                .launchIn(this)
        }

        val listState = rememberLazyListState()

        val shouldLoadMore by remember {
            derivedStateOf {
                val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
                val total = listState.layoutInfo.totalItemsCount
                lastVisible >= total - 3 && total > 0
            }
        }
        LaunchedEffect(shouldLoadMore) {
            if (shouldLoadMore) viewModel.loadMore()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Drips", fontWeight = FontWeight.Bold) }
                )
            }
        ) { padding ->
            if (showImageViewer) {
                FullScreenImageViewer(
                    images = selectedImages,
                    initialPage = selectedImageIndex,
                    onDismiss = { showImageViewer = false }
                )
            }
            
            showTippingFor?.let { post ->
                TippingModal(
                    recipientUsername = post.creator.username,
                    recipientDisplayName = post.creator.displayName,
                    currentBalance = currentBalance,
                    currencyProvider = currencyProvider,
                    onDismiss = { showTippingFor = null },
                    onConfirm = { krAmount ->
                        scope.launch {
                            walletRepository.sendTip(post.creator.id, krAmount.toInt(), currencyProvider.currencyCode)
                            showTippingFor = null
                        }
                    },
                    onInsufficientBalance = {
                        showTippingFor = null
                    }
                )
            }

            PullToRefreshBox(
                isRefreshing = state.isRefreshing,
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.fillMaxSize().padding(padding)
            ) {
                when {
                    state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                    state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(state.error!!, color = MaterialTheme.colorScheme.error)
                            Spacer(Modifier.height(8.dp))
                            Button(onClick = { viewModel.refresh() }) { Text("Retry") }
                        }
                    }
                    else -> LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(state.items.size, key = { index ->
                            state.items[index].id
                        }) { index ->
                            val post = state.items[index]
                            val isSponsored = viewModel.isSponsored(index)
                            
                            if (isSponsored) {
                                SponsoredPostCard(
                                    post = post,
                                    onLike = { 
                                        viewModel.toggleLike(post.id)
                                        viewModel.recordSponsoredEngagement(index, "like")
                                    },
                                    onComment = { 
                                        val uid = currentUserId
                                        if (uid != null) navigator.push(CommentsScreen(ContentType.POST, post.id, uid))
                                        else pendingCommentPost = post
                                        viewModel.recordSponsoredEngagement(index, "comment")
                                    },
                                    onTip = { showTippingFor = post },
                                    onProfileClick = { navigator.push(ProfileScreen(post.creator.id)) },
                                    onAdmire = {
                                        scope.launch {
                                            profileRepository.admire(post.creator.id)
                                        }
                                    },
                                    onImageClick = { images, imgIndex ->
                                        selectedImages = images
                                        selectedImageIndex = imgIndex
                                        showImageViewer = true
                                    },
                                    currentUserId = currentUserId,
                                    profileRepository = profileRepository
                                )
                                
                                // Track sponsored impression
                                LaunchedEffect(index) {
                                    viewModel.recordSponsoredImpression(index)
                                }
                            } else {
                                PostCard(
                                    post = post,
                                    onLike = { viewModel.toggleLike(post.id) },
                                    onComment = { 
                                        val uid = currentUserId
                                        if (uid != null) navigator.push(CommentsScreen(ContentType.POST, post.id, uid))
                                        else pendingCommentPost = post
                                    },
                                    onTip = { showTippingFor = post },
                                    onProfileClick = { navigator.push(ProfileScreen(post.creator.id)) },
                                    onAdmire = {
                                        scope.launch {
                                            profileRepository.admire(post.creator.id)
                                        }
                                    },
                                    onImageClick = { images, imgIndex ->
                                        selectedImages = images
                                        selectedImageIndex = imgIndex
                                        showImageViewer = true
                                    },
                                    currentUserId = currentUserId,
                                    profileRepository = profileRepository
                                )
                            }
                            HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)
                        }

                        if (state.isLoadingMore) {
                            item {
                                Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun PostCard(
        post: Post, 
        onLike: () -> Unit, 
        onComment: () -> Unit, 
        onTip: () -> Unit,
        onProfileClick: () -> Unit,
        onAdmire: () -> Unit,
        onImageClick: (List<String>, Int) -> Unit, 
        currentUserId: String? = null,
        profileRepository: ProfileRepository
    ) {
        val isOwnContent = currentUserId == post.creator.id
        
        Column(modifier = Modifier.fillMaxWidth()) {

            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Profile Picture with Plus Button
                if (!isOwnContent) {
                    ProfileActionButtonWithStories(
                        creatorId = post.creator.id,
                        avatarUrl = post.creator.avatarUrl,
                        onProfileClick = onProfileClick,
                        onAdmireClick = onAdmire,
                        profileRepository = profileRepository
                    )
                } else {
                    // Just show profile picture without plus button for own content
                    AsyncImage(
                        model = post.creator.avatarUrl,
                        contentDescription = post.creator.displayName,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .clickable(onClick = onProfileClick),
                        contentScale = ContentScale.Crop
                    )
                }
                Spacer(Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(post.creator.displayName, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text(
                        "@${post.creator.username}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (post.isLocked) {
                Box(
                    modifier = Modifier.fillMaxWidth().height(300.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        AsyncImage(
                            model = post.imageUrls.firstOrNull(),
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop,
                            alpha = 0.2f
                        )
                    }
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text("🔒", fontSize = 36.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("Subscribers only", fontWeight = FontWeight.Bold)
                        post.requiredTier?.let {
                            Text(
                                it.replace("_", " "),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else if (post.imageUrls.isNotEmpty()) {
                val pagerState = rememberPagerState(pageCount = { post.imageUrls.size })
                Box {
                    HorizontalPager(state = pagerState) { page ->
                        AsyncImage(
                            model = post.imageUrls[page],
                            contentDescription = "Post image ${page + 1}",
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(350.dp)
                                .clickable { onImageClick(post.imageUrls, page) },
                            contentScale = ContentScale.Crop
                        )
                    }
                    if (post.imageUrls.size > 1) {
                        Row(
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            repeat(post.imageUrls.size) { index ->
                                val isActive = pagerState.currentPage == index
                                Box(
                                    modifier = Modifier
                                        .size(if (isActive) 8.dp else 6.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (isActive) androidx.compose.ui.graphics.Color.White 
                                            else androidx.compose.ui.graphics.Color.White.copy(alpha = 0.5f)
                                        )
                                )
                            }
                        }
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val likeColor by animateColorAsState(
                    targetValue = if (post.isLiked) Color.Red else MaterialTheme.colorScheme.onSurface,
                    animationSpec = tween(200),
                    label = "like_color"
                )
                IconButton(onClick = onLike) {
                    Icon(
                        painter = if (post.isLiked) painterResource(Res.drawable.ic_favorite) else painterResource(Res.drawable.ic_favorite),
                        contentDescription = "Like",
                        tint = likeColor
                    )
                }
                Text(
                    "${post.likesCount}",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(end = 8.dp)
                )

                IconButton(onClick = onComment) {
                    Icon(painterResource(Res.drawable.ic_comment), contentDescription = "Comment")
                }
                Text(
                    "${post.commentsCount}",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(end = 8.dp)
                )

                if (!post.isLocked && !isOwnContent) {
                    IconButton(onClick = onTip) {
                        Icon(painterResource(Res.drawable.ic_send), contentDescription = "Tip")
                    }
                }
            }

            if (post.caption.isNotBlank()) {
                com.krieta.com.core.ui.components.HashtagMentionText(
                    text = post.caption,
                    modifier = Modifier.padding(horizontal = 12.dp).padding(bottom = 10.dp),
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 14.sp,
                    onHashtagClick = { tag ->
                    },
                    onMentionClick = { username ->
                    }
                )
            }
        }
    }

    @Composable
    private fun SponsoredPostCard(
        post: Post, 
        onLike: () -> Unit, 
        onComment: () -> Unit, 
        onTip: () -> Unit,
        onProfileClick: () -> Unit,
        onAdmire: () -> Unit,
        onImageClick: (List<String>, Int) -> Unit, 
        currentUserId: String? = null,
        profileRepository: ProfileRepository
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                com.krieta.feature.sponsored.presentation.SponsoredBadge()
                Spacer(Modifier.weight(1f))
                Text(
                    "Promoted",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            PostCard(post, onLike, onComment, onTip, onProfileClick, onAdmire, onImageClick, currentUserId, profileRepository)
        }
    }

    @Composable
    private fun NativeAdCard() {
        val navigator = LocalNavigator.currentOrThrow
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                com.krieta.feature.sponsored.presentation.SponsoredBadge()
                
                Spacer(Modifier.height(12.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surface),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("📸", fontSize = 32.sp)
                    }
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Your Brand Here",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Reach 200k+ engaged users in Kenya. Start from KES 500.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2
                        )
                    }
                }
                
                Spacer(Modifier.height(12.dp))
                
                Button(
                    onClick = { navigator.push(com.krieta.feature.ads.presentation.screen.KrietaAdsManagerScreen()) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = androidx.compose.ui.graphics.Color(0xFFFFCC00)
                    )
                ) {
                    Text("Learn More", color = androidx.compose.ui.graphics.Color.Black)
                }
            }
        }
    }

    @Composable
    private fun BannerAdCard() {
        val navigator = LocalNavigator.currentOrThrow
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp)
                .padding(vertical = 8.dp)
                .clickable { navigator.push(com.krieta.feature.ads.presentation.screen.KrietaAdsManagerScreen()) },
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Box(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("🎯", fontSize = 40.sp)
                    Column {
                        Text(
                            "Banner Ad Space",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "KES 500/day • High visibility",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    com.krieta.feature.sponsored.presentation.SponsoredBadge()
                }
            }
        }
    }

    @Composable
    private fun StoryStyleAdCard() {
        val navigator = LocalNavigator.currentOrThrow
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(400.dp)
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            androidx.compose.ui.graphics.Brush.verticalGradient(
                                listOf(
                                    Color(0xFFFFCC00).copy(alpha = 0.3f),
                                    Color(0xFFFF6B00).copy(alpha = 0.3f)
                                )
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text("🎬", fontSize = 64.sp)
                        Text(
                            "Story-Style Ad",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Full-screen immersive experience",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Button(
                            onClick = { navigator.push(com.krieta.feature.ads.presentation.screen.KrietaAdsManagerScreen()) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = androidx.compose.ui.graphics.Color(0xFFFFCC00)
                            )
                        ) {
                            Text("Swipe Up", color = androidx.compose.ui.graphics.Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                ) {
                    com.krieta.feature.sponsored.presentation.SponsoredBadge()
                }
            }
        }
    }
    
    @Composable
    private fun FullScreenImageViewer(
        images: List<String>,
        initialPage: Int,
        onDismiss: () -> Unit
    ) {
        Dialog(
            onDismissRequest = onDismiss,
            properties = DialogProperties(
                usePlatformDefaultWidth = false,
                dismissOnBackPress = true,
                dismissOnClickOutside = false
            )
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
            ) {
                val pagerState = rememberPagerState(
                    initialPage = initialPage,
                    pageCount = { images.size }
                )
                
                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier.fillMaxSize()
                ) { page ->
                    ZoomableImage(
                        imageUrl = images[page],
                        onDismiss = onDismiss
                    )
                }
                
                // Close button
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                        .size(40.dp)
                        .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                ) {
                    Icon(
                        painter = painterResource(Res.drawable.ic_close),
                        contentDescription = "Close",
                        tint = Color.White
                    )
                }
                
                // Image counter
                if (images.size > 1) {
                    Surface(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(top = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = Color.Black.copy(alpha = 0.6f)
                    ) {
                        Text(
                            "${pagerState.currentPage + 1} / ${images.size}",
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
    
    @Composable
    private fun ZoomableImage(
        imageUrl: String,
        onDismiss: () -> Unit
    ) {
        var scale by remember { mutableStateOf(1f) }
        var offsetX by remember { mutableStateOf(0f) }
        var offsetY by remember { mutableStateOf(0f) }
        
        Box(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        scale = (scale * zoom).coerceIn(1f, 5f)
                        
                        if (scale > 1f) {
                            offsetX += pan.x
                            offsetY += pan.y
                        } else {
                            offsetX = 0f
                            offsetY = 0f
                        }
                    }
                }
                .clickable(
                    indication = null,
                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                ) {
                    if (scale == 1f) {
                        onDismiss()
                    } else {
                        scale = 1f
                        offsetX = 0f
                        offsetY = 0f
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            AsyncImage(
                model = imageUrl,
                contentDescription = "Full screen image",
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer(
                        scaleX = scale,
                        scaleY = scale,
                        translationX = offsetX,
                        translationY = offsetY
                    ),
                contentScale = ContentScale.Fit
            )
        }
    }
    
    @Composable
    private fun ProfileActionButton(
        avatarUrl: String?,
        onProfileClick: () -> Unit,
        onAdmireClick: () -> Unit
    ) {
        Box(
            modifier = Modifier
                .size(40.dp),
            contentAlignment = Alignment.Center
        ) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = "Creator",
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onProfileClick)
                    .border(2.dp, MaterialTheme.colorScheme.primary, CircleShape),
                contentScale = ContentScale.Crop
            )

            Box(
                modifier = Modifier
                    .size(16.dp)
                    .align(Alignment.BottomCenter)
                    .clip(CircleShape)
                    .background(Color(0xFFFF3B5C))
                    .clickable(onClick = onAdmireClick),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "+",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
    
    @Composable
    private fun ProfileActionButtonWithStories(
        creatorId: String,
        avatarUrl: String?,
        onProfileClick: () -> Unit,
        onAdmireClick: () -> Unit,
        profileRepository: ProfileRepository
    ) {
        var hasUnwatchedStories by remember { mutableStateOf(false) }
        
        LaunchedEffect(creatorId) {
            try {
                val result = profileRepository.getProfile(creatorId)
                if (result is com.krieta.com.core.network.NetworkResult.Success) {
                    hasUnwatchedStories = result.data.hasUnwatchedStories
                }
            } catch (e: Exception) {
                // Silent fail
            }
        }
        
        val borderBrush = when {
            hasUnwatchedStories -> Brush.sweepGradient(
                colors = listOf(
                    Color(0xFFFFCC00),
                    Color(0xFFFF6B00),
                    Color(0xFFFFCC00)
                )
            )
            else -> SolidColor(Color.LightGray)
        }
        
        Box(
            modifier = Modifier
                .size(44.dp),
            contentAlignment = Alignment.Center
        ) {
            // Story ring
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .border(2.dp, borderBrush, CircleShape)
                    .padding(2.dp)
            ) {
                // Profile picture
                AsyncImage(
                    model = avatarUrl,
                    contentDescription = "Creator",
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .clickable(onClick = onProfileClick),
                    contentScale = ContentScale.Crop
                )
            }

            Box(
                modifier = Modifier
                    .size(16.dp)
                    .align(Alignment.BottomCenter)
                    .clip(CircleShape)
                    .background(Color(0xFFFF3B5C))
                    .clickable(onClick = onAdmireClick),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "+",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
