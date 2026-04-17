package com.krieta.feature.shorts.presentation.screen

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.ModeComment
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
import coil3.compose.AsyncImage
import com.krieta.com.core.ui.components.VideoPlayer
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.shorts.domain.model.LinkedProduct
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.presentation.viewmodel.ShortsTab
import com.krieta.feature.shorts.presentation.viewmodel.ShortsViewModel
import com.krieta.feature.shorts.presentation.viewmodel.ShortsFeedType
import kotlinx.coroutines.delay

class ShortsScreen(private val feedType: ShortsFeedType = ShortsFeedType.DISCOVER) : Screen {
    @Composable
    override fun Content() {
        val viewModel = koinScreenModel<ShortsViewModel>()
        val state by viewModel.state.collectAsState()

        // Set feed type in viewModel
        LaunchedEffect(feedType) {
            viewModel.setFeedType(feedType)
        }

        val pagerState = rememberPagerState(pageCount = { state.items.size })

        LaunchedEffect(pagerState.currentPage) {
            viewModel.onShortVisible(pagerState.currentPage)
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
                        onLike = { viewModel.toggleLike(short.id) }
                    )
                }
            }

            ShortsTabBar(
                activeTab = state.activeTab,
                onTabSelected = { viewModel.selectTab(it) },
                modifier = Modifier.align(Alignment.TopCenter)
            )

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
        }
    }

    @Composable
    private fun ShortsTabBar(
        activeTab: ShortsTab,
        onTabSelected: (ShortsTab) -> Unit,
        modifier: Modifier = Modifier
    ) {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .padding(top = 48.dp),
            horizontalArrangement = Arrangement.Center
        ) {
            ShortsTab.entries.forEach { tab ->
                val isActive = tab == activeTab
                TextButton(onClick = { onTabSelected(tab) }) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = tab.label,
                            color = if (isActive) Color.White else Color.White.copy(alpha = 0.5f),
                            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 15.sp
                        )
                        if (isActive) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .width(24.dp)
                                    .height(2.dp)
                                    .background(Color.White, shape = MaterialTheme.shapes.small)
                            )
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun ShortItem(
        short: Short,
        isActive: Boolean,
        onLike: () -> Unit
    ) {
        Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
            // Video Player
            var isPlaying by remember { mutableStateOf(isActive) }
            
            LaunchedEffect(isActive) {
                isPlaying = isActive
            }
            
            VideoPlayer(
                url = short.videoUrl,
                isPlaying = isPlaying,
                modifier = Modifier.fillMaxSize(),
                onPlaybackStateChanged = { playing ->
                    isPlaying = playing
                }
            )

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
                Text(
                    "@${short.creator.username}",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    short.caption,
                    color = Color.White,
                    fontSize = 14.sp,
                    maxLines = 3
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
                            imageVector = if (short.isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Like",
                            tint = if (short.isLiked) Color.Red else Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                    Text("${short.likesCount}", color = Color.White, fontSize = 12.sp)
                }

                // Comment
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    IconButton(onClick = { /* Open comment sheet */ }) {
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
                        IconButton(onClick = { /* Open tip dialog */ }) {
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

