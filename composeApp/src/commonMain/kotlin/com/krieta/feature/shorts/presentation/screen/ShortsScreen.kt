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

import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.ModeComment
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
import com.krieta.feature.comments.domain.model.ContentType
import com.krieta.feature.comments.presentation.screen.CommentsScreen
import com.krieta.feature.shorts.domain.model.LinkedProduct
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.presentation.viewmodel.ShortsTab
import com.krieta.feature.shorts.presentation.viewmodel.ShortsViewModel
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.ui.components.TippingModal
import com.krieta.feature.wallet.presentation.viewmodel.WalletViewModel
import com.krieta.feature.wallet.presentation.viewmodel.WalletState
import com.krieta.feature.wallet.domain.repository.WalletRepository
import com.krieta.feature.sponsored.presentation.SponsoredBadge
import kotlinx.coroutines.launch
import org.koin.compose.koinInject
import com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType
import kotlinx.coroutines.delay
import com.krieta.feature.wallet.presentation.screen.TopupScreen

class ShortsScreen(private val feedType: ShortsFeedType = ShortsFeedType.DISCOVER) : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ShortsViewModel>()
        val walletViewModel = koinScreenModel<WalletViewModel>()
        val walletRepository = koinInject<WalletRepository>()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val scope = rememberCoroutineScope()
        
        val state by viewModel.state.collectAsState()
        val walletState by walletViewModel.state.collectAsState()
        val currentBalance = (walletState as? WalletState.Success)?.balance?.krBalance ?: 0.0

        var showTippingFor by remember { mutableStateOf<Short?>(null) }

        // Set feed type in viewModel
        LaunchedEffect(feedType) {
            viewModel.setFeedType(feedType)
        }

        LaunchedEffect(Unit) {
            walletViewModel.fetchWalletData(currencyProvider.countryCode)
        }

        val pagerState = rememberPagerState(pageCount = { state.items.size })

        LaunchedEffect(pagerState.currentPage) {
            viewModel.onShortVisible(pagerState.currentPage)
            
            // Track sponsored impression
            if (viewModel.isSponsored(pagerState.currentPage)) {
                viewModel.recordSponsoredImpression(pagerState.currentPage)
            }
        }

        Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
            if (state.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Color.White
                )
            } else if (state.items.isEmpty()) {
                Text(
                    "No shorts yet",
                    color = Color.White,
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                VerticalPager(
                    state = pagerState,
                    modifier = Modifier.fillMaxSize()
                ) { page ->
                    val short = state.items.getOrNull(page) ?: return@VerticalPager
                    ShortItem(
                        short = short,
                        isActive = page == pagerState.currentPage,
                        isTipModalOpen = showTippingFor != null,
                        isSponsored = viewModel.isSponsored(page),
                        onLike = { 
                            viewModel.toggleLike(short.id)
                            if (viewModel.isSponsored(page)) {
                                viewModel.recordSponsoredEngagement(page, "like")
                            }
                        },
                        onComment = { 
                            navigator.push(CommentsScreen(ContentType.SHORT, short.id, "me"))
                            if (viewModel.isSponsored(page)) {
                                viewModel.recordSponsoredEngagement(page, "comment")
                            }
                        },
                        onTip = { showTippingFor = short },
                        onWatchTimeUpdate = { watchTime ->
                            if (viewModel.isSponsored(page)) {
                                viewModel.recordSponsoredView(page, watchTime)
                            }
                        }
                    )
                }
            }

            if (state.isLoadingMore) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp)
                        .size(24.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
            }

            showTippingFor?.let { short ->
                TippingModal(
                    recipientUsername = short.creator.username,
                    recipientDisplayName = short.creator.displayName,
                    currentBalance = currentBalance,
                    currencyProvider = currencyProvider,
                    onDismiss = { showTippingFor = null },
                    onConfirm = { krAmount ->
                        val fiatAmount = currencyProvider.krToFiat(krAmount)
                        scope.launch {
                            walletRepository.sendTip(short.creator.id, fiatAmount, currencyProvider.currencyCode)
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
        isSponsored: Boolean = false,
        onLike: () -> Unit,
        onComment: () -> Unit,
        onTip: () -> Unit,
        onWatchTimeUpdate: (Int) -> Unit = {}
    ) {
        Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
            // Video Player
            var isPlaying by remember { mutableStateOf(isActive) }
            var showPlayPauseIcon by remember { mutableStateOf(false) }
            var watchTime by remember { mutableStateOf(0) }
            
            // Track watch time for sponsored content
            LaunchedEffect(isPlaying, isActive) {
                if (isPlaying && isActive) {
                    while (true) {
                        delay(1000)
                        watchTime++
                        onWatchTimeUpdate(watchTime)
                    }
                }
            }
            
            // Pause when tip modal opens
            LaunchedEffect(isActive, isTipModalOpen) {
                isPlaying = isActive && !isTipModalOpen
            }

            // Auto-hide play/pause icon after 1.5 seconds
            LaunchedEffect(showPlayPauseIcon) {
                if (showPlayPauseIcon) {
                    delay(1500)
                    showPlayPauseIcon = false
                }
            }
            
            VideoPlayer(
                url = short.videoUrl,
                isPlaying = isPlaying,
                modifier = Modifier.fillMaxSize(),
                onPlaybackStateChanged = { playing ->
                    isPlaying = playing
                }
            )

            // Tap to toggle play/pause
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(
                        indication = null,
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                    ) {
                        isPlaying = !isPlaying
                        showPlayPauseIcon = true
                    },
                contentAlignment = Alignment.Center
            ) {
                // Play/Pause icon overlay
                AnimatedVisibility(
                    visible = showPlayPauseIcon,
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(Color.Black.copy(alpha = 0.5f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = if (isPlaying) "Pause" else "Play",
                            tint = Color.White,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                }
            }

            // Locked overlay
            if (short.isLocked) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.7f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🔒", fontSize = 40.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Subscribers only",
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        short.requiredTier?.let {
                            Text(it.replace("_", " "), color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                        }
                    }
                }
            }

            // Linked product popup — slides in briefly when the short becomes active
            short.linkedProduct?.let { product ->
                LinkedProductPopup(
                    product = product,
                    isActive = isActive,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 120.dp, start = 16.dp, end = 72.dp)
                )
            }

            // Bottom overlay: creator info + caption
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .padding(16.dp)
                    .padding(bottom = 32.dp)
            ) {
                // Sponsored badge
                if (isSponsored) {
                    SponsoredBadge(
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }
                
                Text(
                    "@${short.creator.username}",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                com.krieta.com.core.ui.components.HashtagMentionText(
                    text = short.caption,
                    color = Color.White,
                    fontSize = 14.sp,
                    maxLines = 3,
                    onHashtagClick = { tag ->
                        // Navigate to hashtag search (future)
                    },
                    onMentionClick = { username ->
                        // Navigate to user profile (future)
                    }
                )
                short.musicTrack?.let {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("🎵 $it", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                }
            }

            // Right side actions
            Column(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Like
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    IconButton(onClick = onLike) {
                        Icon(
                            imageVector = if (short.isLiked) painterResource(Res.drawable.ic_favorite) else painterResource(Res.drawable.ic_favorite)Border,
                            contentDescription = "Like",
                            tint = if (short.isLiked) Color.Red else Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                    Text("${short.likesCount}", color = Color.White, fontSize = 12.sp)
                }

                // Comment
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    IconButton(onClick = onComment) {
                        Icon(
                            Icons.Default.ModeComment,
                            contentDescription = "Comment",
                            tint = Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                    Text("${short.commentsCount}", color = Color.White, fontSize = 12.sp)
                }

                // Tip (only if not locked)
                if (!short.isLocked) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        IconButton(onClick = onTip) {
                            Icon(
                                Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Tip",
                                tint = Color.White,
                                modifier = Modifier.size(30.dp)
                            )
                        }
                        Text("Tip", color = Color.White, fontSize = 12.sp)
                    }
                }
            }
        }
    }

    /**
     * Product popup that slides in from the bottom and auto-hides after 4 seconds.
     * Appears when a Short has a linked shop product.
     */
    @Composable
    private fun LinkedProductPopup(
        product: LinkedProduct,
        isActive: Boolean,
        modifier: Modifier = Modifier
    ) {
        var visible by remember { mutableStateOf(false) }

        LaunchedEffect(isActive) {
            if (isActive) {
                delay(800) // Wait a moment before showing
                visible = true
                delay(4000) // Show for 4 seconds
                visible = false
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
                colors = CardDefaults.cardColors(
                    containerColor = Color.Black.copy(alpha = 0.85f)
                )
            ) {
                Row(
                    modifier = Modifier
                        .padding(10.dp)
                        .clickable { /* Navigate to product detail / WhatsApp */ },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    product.imageUrl?.let { url ->
                        AsyncImage(
                            model = url,
                            contentDescription = product.title,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(Modifier.width(10.dp))
                    } ?: run {
                        Icon(
                            Icons.Default.ShoppingBag,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(Modifier.width(10.dp))
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            product.title,
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            maxLines = 1
                        )
                        Text(
                            KrCurrencyFormatter.formatKr(product.priceKr),
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 12.sp
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.primary
                    ) {
                        Text(
                            "View",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

