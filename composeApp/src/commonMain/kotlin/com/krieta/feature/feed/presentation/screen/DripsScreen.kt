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

import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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

class DripsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<FeedViewModel>()
        val walletViewModel = koinScreenModel<WalletViewModel>()
        val walletRepository = koinInject<WalletRepository>()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val tokenManager = koinInject<com.krieta.com.core.security.TokenManager>()
        val scope = rememberCoroutineScope()
        
        val state by viewModel.state.collectAsState()
        val walletState by walletViewModel.state.collectAsState()
        val currentBalance = (walletState as? WalletState.Success)?.balance?.krBalance ?: 0.0

        var showTippingFor by remember { mutableStateOf<Post?>(null) }
        var currentUserId by remember { mutableStateOf<String?>(null) }
        
        LaunchedEffect(Unit) {
            currentUserId = tokenManager.getUserId()
            currencyProvider.start()
            kotlinx.coroutines.delay(500)
            walletViewModel.fetchWalletData(currencyProvider.countryCode)
            
            UploadCompletionNotifier.uploadCompletions
                .onEach { event ->
                    if (event.success && event.type == UploadType.DRIP) {
                        viewModel.refresh()
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
            showTippingFor?.let { post ->
                TippingModal(
                    recipientUsername = post.creator.username,
                    recipientDisplayName = post.creator.displayName,
                    currentBalance = currentBalance,
                    currencyProvider = currencyProvider,
                    onDismiss = { showTippingFor = null },
                    onConfirm = { krAmount ->
                        val fiatAmount = currencyProvider.krToFiat(krAmount)
                        scope.launch {
                            walletRepository.sendTip(post.creator.id, fiatAmount, currencyProvider.currencyCode)
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
                        val postsWithAds = mutableListOf<Any>()
                        state.items.forEachIndexed { index, post ->
                            postsWithAds.add(post)
                            
                            if ((index + 1) % 6 == 0 && index < state.items.size - 1) {
                                postsWithAds.add("NATIVE_AD_$index")
                            }
                            else if ((index + 1) % 15 == 0 && index < state.items.size - 1) {
                                postsWithAds.add("BANNER_AD_$index")
                            }
                            else if ((index + 1) % 20 == 0 && index < state.items.size - 1) {
                                postsWithAds.add("STORY_AD_$index")
                            }
                        }

                        items(postsWithAds.size, key = { index ->
                            val item = postsWithAds[index]
                            if (item is Post) item.id else "ad_$index"
                        }) { index ->
                            val item = postsWithAds[index]
                            when {
                                item is Post -> {
                                    if (item.isSponsored == true) {
                                        SponsoredPostCard(
                                            post = item,
                                            onLike = { viewModel.toggleLike(item.id) },
                                            onComment = { 
                                                currentUserId?.let { userId ->
                                                    navigator.push(CommentsScreen(ContentType.POST, item.id, userId))
                                                }
                                            },
                                            onTip = { showTippingFor = item }
                                        )
                                    } else {
                                        PostCard(
                                            post = item,
                                            onLike = { viewModel.toggleLike(item.id) },
                                            onComment = { 
                                                currentUserId?.let { userId ->
                                                    navigator.push(CommentsScreen(ContentType.POST, item.id, userId))
                                                }
                                            },
                                            onTip = { showTippingFor = item }
                                        )
                                    }
                                    HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)
                                }
                                item is String && item.startsWith("NATIVE_AD") -> {
                                    NativeAdCard()
                                    HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)
                                }
                                item is String && item.startsWith("BANNER_AD") -> {
                                    BannerAdCard()
                                    HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)
                                }
                                item is String && item.startsWith("STORY_AD") -> {
                                    StoryStyleAdCard()
                                    HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)
                                }
                            }
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
    private fun PostCard(post: Post, onLike: () -> Unit, onComment: () -> Unit, onTip: () -> Unit) {
        Column(modifier = Modifier.fillMaxWidth()) {

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
                            modifier = Modifier.fillMaxWidth().height(350.dp),
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

                if (!post.isLocked) {
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
    private fun SponsoredPostCard(post: Post, onLike: () -> Unit, onComment: () -> Unit, onTip: () -> Unit) {
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
            
            PostCard(post, onLike, onComment, onTip)
        }
    }

    @Composable
    private fun NativeAdCard() {
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
                    onClick = { },
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
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp)
                .padding(vertical = 8.dp),
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
                            onClick = { },
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
}
