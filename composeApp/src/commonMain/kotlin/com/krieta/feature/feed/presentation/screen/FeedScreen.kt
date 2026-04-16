package com.krieta.feature.feed.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.ModeComment
import androidx.compose.material.icons.automirrored.filled.Send
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
import com.krieta.feature.feed.domain.model.Post
import com.krieta.feature.feed.presentation.viewmodel.FeedViewModel

class FeedScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val viewModel = koinScreenModel<FeedViewModel>()
        val state by viewModel.state.collectAsState()
        val listState = rememberLazyListState()

        // Infinite scroll trigger
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

        var selectedTab by remember { mutableStateOf(0) }

        Scaffold(
            topBar = {
                SecondaryTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = MaterialTheme.colorScheme.primary
                ) {
                    Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                        Text("Contests", modifier = Modifier.padding(16.dp), fontWeight = FontWeight.SemiBold)
                    }
                    Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                        Text("Discover", modifier = Modifier.padding(16.dp), fontWeight = FontWeight.SemiBold)
                    }
                    Tab(selected = selectedTab == 2, onClick = { selectedTab = 2 }) {
                        Text("Admiring", modifier = Modifier.padding(16.dp), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                when (selectedTab) {
                    0 -> com.krieta.feature.contests.presentation.screen.ContestFeedScreen().Content()
                    1 -> com.krieta.feature.shorts.presentation.screen.ShortsScreen().Content()
                    2 -> {
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
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(state.items, key = { it.id }) { post ->
                        PostCard(
                            post = post,
                            onLike = { viewModel.toggleLike(post.id) }
                        )
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
        }
    }

    @Composable
    private fun PostCard(post: Post, onLike: () -> Unit) {
        Column(modifier = Modifier.fillMaxWidth()) {

            // Header: avatar + username
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = post.creator.avatarUrl,
                    contentDescription = post.creator.displayName,
                    modifier = Modifier.size(40.dp).clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
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

            // Image carousel (or locked overlay)
            if (post.isLocked) {
                Box(
                    modifier = Modifier.fillMaxWidth().height(300.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        // Blurred placeholder
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
                            modifier = Modifier.fillMaxWidth().height(350.dp),
                            contentScale = ContentScale.Crop
                        )
                    }
                    // Dot indicators
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
                                        .then(
                                            Modifier
                                        )
                                )
                            }
                        }
                    }
                }
            }

            // Action row: like, comment, tip
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Animated like button
                val likeColor by animateColorAsState(
                    targetValue = if (post.isLiked) Color.Red else MaterialTheme.colorScheme.onSurface,
                    animationSpec = tween(200),
                    label = "like_color"
                )
                IconButton(onClick = onLike) {
                    Icon(
                        imageVector = if (post.isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Like",
                        tint = likeColor
                    )
                }
                Text(
                    "${post.likesCount}",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(end = 8.dp)
                )

                IconButton(onClick = { /* Open comments */ }) {
                    Icon(Icons.Default.ModeComment, contentDescription = "Comment")
                }
                Text(
                    "${post.commentsCount}",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(end = 8.dp)
                )

                // Tip only on unlocked posts
                if (!post.isLocked) {
                    IconButton(onClick = { /* Open tip dialog */ }) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Tip")
                    }
                }
            }

            // Caption
            if (post.caption.isNotBlank()) {
                Text(
                    text = post.caption,
                    modifier = Modifier.padding(horizontal = 12.dp).padding(bottom = 10.dp),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

