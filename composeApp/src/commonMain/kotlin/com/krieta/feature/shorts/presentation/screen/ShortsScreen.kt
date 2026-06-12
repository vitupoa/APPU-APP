package com.krieta.feature.shorts.presentation.screen

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.border
import androidx.compose.ui.draw.blur

import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.ui.components.VideoPlayer
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.com.core.util.currentTimeMillis
import com.krieta.feature.comments.domain.model.ContentType
import com.krieta.feature.comments.presentation.screen.CommentsScreen
import com.krieta.feature.comments.presentation.screen.CommentsBottomSheet
import com.krieta.feature.comments.presentation.viewmodel.CommentsViewModel
import org.koin.core.parameter.parametersOf
import cafe.adriel.voyager.koin.koinScreenModel
import com.krieta.feature.shorts.domain.model.LinkedProduct
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.presentation.viewmodel.ShortsViewModel
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.ui.components.TippingModal
import com.krieta.feature.wallet.presentation.viewmodel.WalletViewModel
import com.krieta.feature.wallet.presentation.viewmodel.WalletState
import com.krieta.feature.wallet.domain.repository.WalletRepository
import com.krieta.feature.sponsored.presentation.SponsoredBadge
import com.krieta.feature.profile.domain.repository.ProfileRepository
import com.krieta.feature.profile.presentation.screen.ProfileScreen
import kotlinx.coroutines.launch
import org.koin.compose.koinInject
import com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType
import kotlinx.coroutines.delay
import com.krieta.feature.wallet.presentation.screen.TopupScreen
import com.krieta.com.core.upload.UploadCompletionNotifier
import com.krieta.com.core.upload.UploadType
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

class ShortsScreen(private val feedType: ShortsFeedType = ShortsFeedType.DISCOVER) : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ShortsViewModel>()
        val walletViewModel = koinScreenModel<WalletViewModel>()
        val walletRepository = koinInject<WalletRepository>()
        val profileRepository = koinInject<ProfileRepository>()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val tokenManager = koinInject<com.krieta.com.core.security.TokenManager>()
        val shareManager = koinInject<com.krieta.com.core.util.ShareManager>()
        val scope = rememberCoroutineScope()

        val state by viewModel.state.collectAsState()
        val walletState by walletViewModel.state.collectAsState()
        val currentBalance = (walletState as? WalletState.Success)?.balance?.krBalance ?: 0.0

        var currentUserId by remember { mutableStateOf<String?>(null) }
        var showCommentsFor by remember { mutableStateOf<Short?>(null) }
        var showTippingFor by remember { mutableStateOf<Short?>(null) }
        var isCommentsOpen by remember { mutableStateOf(false) }

        LaunchedEffect(showCommentsFor) {
            isCommentsOpen = showCommentsFor != null
        }

        LaunchedEffect(Unit) {
            currentUserId = tokenManager.getUserId()

            UploadCompletionNotifier.uploadCompletions
                .onEach { event ->
                    if (event.success && event.type == UploadType.SHORT) {
                        if (event.contentId.isNotEmpty()) viewModel.addNewShort(event.contentId)
                        else viewModel.refresh()
                    }
                }
                .launchIn(this)
        }

        LaunchedEffect(feedType) { viewModel.setFeedType(feedType) }

        LaunchedEffect(Unit) {
            currencyProvider.start()
            delay(500)
            walletViewModel.fetchWalletData(currencyProvider.countryCode)
        }

        val pagerState = rememberPagerState(pageCount = { state.items.size })

        LaunchedEffect(pagerState.currentPage) {
            viewModel.onShortVisible(pagerState.currentPage)
            for (i in 1..3) {
                val nextIndex = pagerState.currentPage + i
                if (nextIndex < state.items.size) {
                    launch { /* preload hint */ }
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            PullToRefreshBox(
                isRefreshing = state.isRefreshing,
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.fillMaxSize()
            ) {
                when {
                    state.isLoading -> CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = Color.White
                    )
                    state.items.isEmpty() -> Text(
                        "No shorts yet",
                        color = Color.White,
                        modifier = Modifier.align(Alignment.Center)
                    )
                    else -> VerticalPager(
                        state = pagerState,
                        modifier = Modifier.fillMaxSize()
                    ) { page ->
                        val short = state.items.getOrNull(page) ?: return@VerticalPager
                        val isSponsored = viewModel.isSponsored(page)

                        ShortItem(
                            short = short,
                            isActive = page == pagerState.currentPage,
                            isTipModalOpen = showTippingFor != null,
                            isCommentsOpen = isCommentsOpen,
                            isSponsored = isSponsored,
                            isOwnContent = currentUserId == short.creator.id,
                            onProfileClick = { navigator.push(ProfileScreen(short.creator.id)) },
                            onAdmire = {
                                scope.launch {
                                    profileRepository.admire(short.creator.id)
                                    // TODO: Update UI state to reflect admire status
                                }
                            },
                            onLike = {
                                viewModel.toggleLike(short.id)
                                if (isSponsored) viewModel.recordSponsoredEngagement(page, "like")
                            },
                            onComment = {
                                if (currentUserId != null) {
                                    showCommentsFor = short
                                    if (isSponsored) viewModel.recordSponsoredEngagement(page, "comment")
                                }
                            },
                            onTip = { showTippingFor = short },
                            onBookmark = {
                                viewModel.toggleBookmark(short.id)
                            },
                            onShare = {
                                scope.launch {
                                    viewModel.trackShare(short.id)
                                    shareManager.share(
                                        text = "Check out this short by @${short.creator.username}: ${short.caption}",
                                        url = "https://krieta.com/shorts/${short.id}"
                                    )
                                }
                            },
                            onWatchTimeUpdate = { watchTime ->
                                if (isSponsored && watchTime >= 3) viewModel.recordSponsoredView(page, watchTime)
                            },
                            onViewTracked = { watchDuration, totalDuration ->
                                viewModel.trackView(short.id, watchDuration, totalDuration)
                            }
                        )

                        LaunchedEffect(page, isSponsored) {
                            if (isSponsored && page == pagerState.currentPage) {
                                viewModel.recordSponsoredImpression(page)
                            }
                        }
                    }
                }
            }

            if (state.isLoadingMore) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 130.dp)
                        .size(24.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
            }

            showCommentsFor?.let { short ->
                currentUserId?.let { userId ->
                    val commentsViewModel = koinScreenModel<CommentsViewModel> {
                        parametersOf(ContentType.SHORT, short.id, userId)
                    }
                    CommentsBottomSheet(
                        viewModel = commentsViewModel,
                        onDismiss = { showCommentsFor = null },
                        onProfileClick = { profileId ->
                            showCommentsFor = null
                            navigator.push(ProfileScreen(profileId))
                        }
                    )
                }
            }

            showTippingFor?.let { short ->
                TippingModal(
                    recipientUsername = short.creator.username,
                    recipientDisplayName = short.creator.displayName,
                    currentBalance = currentBalance,
                    currencyProvider = currencyProvider,
                    onDismiss = { showTippingFor = null },
                    onConfirm = { krAmount ->
                        scope.launch {
                            walletRepository.sendTip(short.creator.id, krAmount.toInt(), currencyProvider.currencyCode)
                            showTippingFor = null
                        }
                    },
                    onInsufficientBalance = {
                        showTippingFor = null
                        navigator.push(TopupScreen())
                    }
                )
            }
        }
    }

    @Composable
    private fun ShortItem(
        short: Short,
        isActive: Boolean,
        isTipModalOpen: Boolean,
        isCommentsOpen: Boolean,
        isSponsored: Boolean = false,
        isOwnContent: Boolean = false,
        onProfileClick: () -> Unit,
        onAdmire: () -> Unit,
        onLike: () -> Unit,
        onComment: () -> Unit,
        onTip: () -> Unit,
        onBookmark: () -> Unit,
        onShare: () -> Unit,
        onWatchTimeUpdate: (Int) -> Unit = {},
        onViewTracked: (Long, Long) -> Unit = { _, _ -> }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {

            // ── MEDIA LAYER ──────────────────────────────────────────────────
            if (short.mediaType == "PHOTO" || short.mediaType == "IMAGE") {
                ImmersivePhotoLayer(
                    url = short.mediaUrls.firstOrNull() ?: short.thumbnailUrl ?: short.videoUrl,
                    aspectRatio = short.aspectRatio
                )
            } else if (short.videoUrl != null) {
                ImmersiveVideoLayer(
                    short = short,
                    isActive = isActive,
                    isTipModalOpen = isTipModalOpen,
                    isCommentsOpen = isCommentsOpen,
                    onWatchTimeUpdate = onWatchTimeUpdate,
                    onViewTracked = onViewTracked
                )
            }

            // ── LOCKED OVERLAY ───────────────────────────────────────────────
            if (short.isLocked) {
                Box(
                    modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.7f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🔒", fontSize = 40.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("Subscribers only", color = Color.White, fontWeight = FontWeight.Bold)
                        short.requiredTier?.let {
                            Text(it.replace("_", " "), color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                        }
                    }
                }
            }

            // ── LINKED PRODUCT POPUP ─────────────────────────────────────────
            short.linkedProduct?.let { product ->
                LinkedProductPopup(
                    product = product,
                    isActive = isActive,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(start = 16.dp, end = 80.dp, bottom = 180.dp)
                )
            }

            // ── BOTTOM GRADIENT + TEXT ───────────────────────────────────────
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.8f))
                        )
                    )
                    .padding(start = 16.dp, end = 80.dp, top = 60.dp, bottom = 135.dp)
            ) {
                if (isSponsored) {
                    SponsoredBadge(modifier = Modifier.padding(bottom = 8.dp))
                }
                Text(
                    "@${short.creator.username}",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(Modifier.height(4.dp))
                com.krieta.com.core.ui.components.HashtagMentionText(
                    text = short.caption,
                    color = Color.White,
                    fontSize = 14.sp,
                    maxLines = 3,
                    onHashtagClick = {},
                    onMentionClick = {}
                )
                short.musicTrack?.let {
                    Spacer(Modifier.height(6.dp))
                    Text("🎵 $it", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                }
            }

            // ── RIGHT ACTION PANEL ───────────────────────────────────────────
            Column(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 12.dp, bottom = 150.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Profile + Plus (Admire)
                if (!isOwnContent) {
                    ProfileActionButton(
                        avatarUrl = short.creator.avatarUrl,
                        onProfileClick = onProfileClick,
                        onAdmireClick = onAdmire
                    )
                }

                // Heart (Like)
                ActionButton(
                    icon = {
                        Icon(
                            painter = if (short.isLiked) painterResource(Res.drawable.ic_favorite)
                                      else painterResource(Res.drawable.ic_favorite_border),
                            contentDescription = "Like",
                            tint = if (short.isLiked) Color.Red else Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    },
                    label = formatCount(short.likesCount),
                    onClick = onLike
                )

                // Comment
                ActionButton(
                    icon = {
                        Icon(
                            painterResource(Res.drawable.ic_comment),
                            contentDescription = "Comment",
                            tint = Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    },
                    label = formatCount(short.commentsCount),
                    onClick = onComment
                )

                // Tip (only if not locked and not own content)
                if (!short.isLocked && !isOwnContent) {
                    ActionButton(
                        icon = {
                            Icon(
                                painterResource(Res.drawable.ic_send),
                                contentDescription = "Tip",
                                tint = Color.White,
                                modifier = Modifier.size(32.dp)
                            )
                        },
                        label = "Tip",
                        onClick = onTip
                    )
                }

                // Bookmark
                ActionButton(
                    icon = {
                        Icon(
                            painter = if (short.isBookmarked) painterResource(Res.drawable.ic_bookmark)
                                      else painterResource(Res.drawable.ic_bookmark_border),
                            contentDescription = "Save",
                            tint = if (short.isBookmarked) Color(0xFFFFD700) else Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    },
                    label = "Save",
                    onClick = onBookmark
                )

                // Share
                ActionButton(
                    icon = {
                        Icon(
                            painterResource(Res.drawable.ic_share),
                            contentDescription = "Share",
                            tint = Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    },
                    label = "Share",
                    onClick = onShare
                )
            }
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
                .size(56.dp),
            contentAlignment = Alignment.Center
        ) {
            // Profile picture
            AsyncImage(
                model = avatarUrl,
                contentDescription = "Creator",
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onProfileClick)
                    .border(2.dp, Color.White, CircleShape),
                contentScale = ContentScale.Crop
            )

            // Plus button overlay at bottom
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .align(Alignment.BottomCenter)
                    .offset(y = 4.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFFF3B5C))
                    .clickable(onClick = onAdmireClick),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "+",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }

    @Composable
    private fun ActionButton(
        icon: @Composable () -> Unit,
        label: String,
        onClick: () -> Unit
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.clickable(
                indication = null,
                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                onClick = onClick
            )
        ) {
            icon()
            Spacer(Modifier.height(4.dp))
            Text(label, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Medium)
        }
    }

    private fun formatCount(count: Int): String {
        return when {
            count >= 1_000_000 -> "${count / 1_000_000}M"
            count >= 1_000 -> "${count / 1_000}K"
            else -> count.toString()
        }
    }

    @Composable
    private fun ImmersiveVideoLayer(
        short: Short,
        isActive: Boolean,
        isTipModalOpen: Boolean,
        isCommentsOpen: Boolean,
        onWatchTimeUpdate: (Int) -> Unit,
        onViewTracked: (Long, Long) -> Unit
    ) {
        var isPlaying by remember { mutableStateOf(isActive) }
        var showPlayPauseIcon by remember { mutableStateOf(false) }
        var watchTime by remember { mutableStateOf(0) }
        var currentPosition by remember { mutableStateOf(0L) }
        var duration by remember { mutableStateOf(0L) }
        var seekToPosition by remember { mutableStateOf<Long?>(null) }

        LaunchedEffect(isPlaying, isActive) {
            if (isPlaying && isActive) {
                while (true) { delay(1000); watchTime++; onWatchTimeUpdate(watchTime) }
            }
        }

        DisposableEffect(short.id, isActive) {
            val startTime = currentTimeMillis()
            onDispose {
                if (isActive) onViewTracked(currentTimeMillis() - startTime, duration)
            }
        }

        LaunchedEffect(isActive, isTipModalOpen, isCommentsOpen) {
            isPlaying = isActive && !isTipModalOpen && !isCommentsOpen
        }

        LaunchedEffect(showPlayPauseIcon) {
            if (showPlayPauseIcon) { delay(1500); showPlayPauseIcon = false }
        }

        val isLandscape = (short.aspectRatio ?: 0f) > 1.1f

        Box(modifier = Modifier.fillMaxSize()) {
            if (isLandscape) {
                AsyncImage(
                    model = short.thumbnailUrl ?: short.videoUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize().blur(24.dp),
                    contentScale = ContentScale.Crop
                )
                Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.4f)))
            }

            VideoPlayer(
                url = short.videoUrl,
                isPlaying = isPlaying,
                modifier = if (isLandscape && short.aspectRatio != null)
                    Modifier.fillMaxWidth().aspectRatio(short.aspectRatio).align(Alignment.Center)
                else
                    Modifier.fillMaxSize(),
                onPlaybackStateChanged = { playing -> isPlaying = playing },
                onProgressUpdate = { pos, dur -> currentPosition = pos; duration = dur },
                seekToPosition = seekToPosition
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(
                        indication = null,
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                    ) { isPlaying = !isPlaying; showPlayPauseIcon = true },
                contentAlignment = Alignment.Center
            ) {
                // Only show play/pause icon, don't block touches on UI elements
                AnimatedVisibility(visible = showPlayPauseIcon, enter = fadeIn(), exit = fadeOut()) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(Color.Black.copy(alpha = 0.5f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = if (isPlaying) painterResource(Res.drawable.ic_pause)
                                      else painterResource(Res.drawable.ic_play_arrow),
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                }
            }

            if (duration > 0) {
                LinearProgressIndicator(
                    progress = { (currentPosition.toFloat() / duration.toFloat()).coerceIn(0f, 1f) },
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 78.dp)
                        .fillMaxWidth()
                        .height(3.dp),
                    color = Color.White,
                    trackColor = Color.White.copy(alpha = 0.25f)
                )
            }
        }
    }

    @Composable
    private fun ImmersivePhotoLayer(url: String, aspectRatio: Float?) {
        val isLandscapeOrSquare = (aspectRatio ?: 0f) >= 0.95f

        Box(modifier = Modifier.fillMaxSize()) {
            if (isLandscapeOrSquare) {
                AsyncImage(
                    model = url,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize().blur(24.dp),
                    contentScale = ContentScale.Crop
                )
                Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f)))
            }

            AsyncImage(
                model = url,
                contentDescription = null,
                modifier = if (isLandscapeOrSquare && aspectRatio != null)
                    Modifier.fillMaxWidth().aspectRatio(aspectRatio).align(Alignment.Center)
                else
                    Modifier.fillMaxSize(),
                contentScale = if (isLandscapeOrSquare) ContentScale.Fit else ContentScale.Crop
            )
        }
    }

    @Composable
    private fun LinkedProductPopup(
        product: LinkedProduct,
        isActive: Boolean,
        modifier: Modifier = Modifier
    ) {
        var visible by remember { mutableStateOf(false) }

        LaunchedEffect(isActive) {
            if (isActive) {
                delay(800); visible = true
                delay(4000); visible = false
            } else {
                visible = false
            }
        }

        AnimatedVisibility(
            visible = visible,
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
            modifier = modifier
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.85f))
            ) {
                Row(
                    modifier = Modifier.padding(10.dp).clickable { },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    product.imageUrl?.let { url ->
                        AsyncImage(
                            model = url,
                            contentDescription = product.title,
                            modifier = Modifier.size(44.dp).clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(Modifier.width(10.dp))
                    } ?: run {
                        Icon(
                            painterResource(Res.drawable.ic_shopping_bag),
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(Modifier.width(10.dp))
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(product.title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, maxLines = 1)
                        Text(KrCurrencyFormatter.formatKr(product.priceKr), color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                    }
                    Surface(shape = RoundedCornerShape(8.dp), color = MaterialTheme.colorScheme.primary) {
                        Text("View", modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp), color = MaterialTheme.colorScheme.onPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
