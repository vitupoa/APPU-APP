package com.runinga.feature.contests.presentation.screen

import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.runinga.feature.ads.presentation.components.ContestSponsorBanner
import com.runinga.com.core.location.UserCurrencyProvider
import com.runinga.com.core.ui.components.VideoPlayer
import com.runinga.feature.comments.domain.model.ContentType
import com.runinga.feature.comments.presentation.screen.CommentsScreen
import com.runinga.feature.contests.domain.model.ContestSubmission
import com.runinga.feature.contests.presentation.viewmodel.ContestSubmissionFeedViewModel
import com.runinga.feature.profile.presentation.screen.ProfileScreen
import org.koin.compose.koinInject
import org.koin.core.parameter.parametersOf
import kotlin.math.abs
import kotlinx.coroutines.launch

class ContestSubmissionFeedScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ContestSubmissionFeedViewModel> { parametersOf(null) }
        val state by viewModel.state.collectAsState()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val tokenManager = koinInject<com.runinga.com.core.security.TokenManager>()
        val scope = rememberCoroutineScope()
        
        var currentUserId by remember { mutableStateOf<String?>(null) }
        
        LaunchedEffect(Unit) {
            currentUserId = tokenManager.getUserId()
        }
        
        val pagerState = rememberPagerState(pageCount = { state.submissions.size })

        LaunchedEffect(pagerState.currentPage) {
            if (pagerState.currentPage >= state.submissions.size - 3 && !state.isLoadingMore) {
                viewModel.loadMore()
            }
        }

        Box(modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)) {
            when {
                state.isLoading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color.White)
                    }
                }
                state.error != null -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(state.error!!, color = Color.White)
                            Spacer(Modifier.height(16.dp))
                            Button(onClick = { viewModel.refresh() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                state.submissions.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No contest submissions yet", color = Color.White)
                    }
                }
                else -> {
                    VerticalPager(
                        state = pagerState,
                        modifier = Modifier.fillMaxSize()
                    ) { page ->
                        val submission = state.submissions[page]
                        val showSponsorBanner = page > 0 && page % 7 == 0
                        
                        Box(modifier = Modifier.fillMaxSize()) {
                            SubmissionItem(
                                submission = submission,
                                isActive = page == pagerState.currentPage,
                                onProfileClick = { navigator.push(ProfileScreen(submission.user.id)) },
                                onUpvote = { viewModel.upvoteSubmission(submission.id) },
                                onDownvote = { viewModel.downvoteSubmission(submission.id) },
                                onComment = { 
                                    currentUserId?.let { userId ->
                                        navigator.push(CommentsScreen(ContentType.CONTEST_SUBMISSION, submission.id, userId))
                                    }
                                },
                                onBookmark = {
                                    scope.launch {
                                        println("Bookmark contest submission: ${submission.id}")
                                    }
                                },
                                onShare = {
                                    scope.launch {
                                        println("Share contest submission: ${submission.id}")
                                    }
                                },
                                onContestClick = { navigator.push(ContestDetailScreen(submission.contestId)) },
                                currencyProvider = currencyProvider
                            )
                            
                            if (showSponsorBanner) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopCenter)
                                        .padding(top = 16.dp)
                                ) {
                                    ContestSponsorBanner(
                                        sponsorName = "Safaricom",
                                        onSponsorClick = { /* Track sponsor click */ }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun SubmissionItem(
        submission: ContestSubmission,
        isActive: Boolean,
        onProfileClick: () -> Unit,
        onUpvote: () -> Unit,
        onDownvote: () -> Unit,
        onComment: () -> Unit,
        onBookmark: () -> Unit,
        onShare: () -> Unit,
        onContestClick: () -> Unit,
        currencyProvider: UserCurrencyProvider
    ) {
        var offsetX by remember { mutableStateOf(0f) }
        val swipeThreshold = 300f

        Box(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectHorizontalDragGestures(
                        onDragEnd = {
                            when {
                                offsetX > swipeThreshold -> onUpvote()
                                offsetX < -swipeThreshold -> onDownvote()
                            }
                            offsetX = 0f
                        },
                        onHorizontalDrag = { _, dragAmount ->
                            offsetX += dragAmount
                        }
                    )
                }
        ) {
            // Media layer
            if (submission.mediaType == "VIDEO") {
                var isPlaying by remember { mutableStateOf(isActive) }
                var currentPosition by remember { mutableStateOf(0L) }
                var duration by remember { mutableStateOf(0L) }
                var seekToPosition by remember { mutableStateOf<Long?>(null) }
                
                LaunchedEffect(isActive) {
                    isPlaying = isActive
                }
                
                VideoPlayer(
                    url = submission.mediaUrl,
                    isPlaying = isPlaying,
                    modifier = Modifier.fillMaxSize(),
                    onPlaybackStateChanged = { playing ->
                        isPlaying = playing
                    },
                    onProgressUpdate = { position, dur ->
                        currentPosition = position
                        duration = dur
                    },
                    seekToPosition = seekToPosition
                )
                
                com.runinga.com.core.ui.components.VideoProgressBar(
                    currentPosition = currentPosition,
                    duration = duration,
                    onSeek = { position -> seekToPosition = position },
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .windowInsetsPadding(WindowInsets.navigationBars)
                        .padding(bottom = 2.dp, start = 16.dp, end = 72.dp)
                )
            } else {
                Box(modifier = Modifier.fillMaxSize()) {
                    AsyncImage(
                        model = submission.mediaUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize().blur(24.dp),
                        contentScale = ContentScale.Crop
                    )
                    Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f)))
                    AsyncImage(
                        model = submission.mediaUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }
            }

            // Swipe indicators
            val leftAlpha by animateFloatAsState(
                targetValue = if (offsetX < -50f) (abs(offsetX) / swipeThreshold).coerceIn(0f, 1f) else 0f
            )
            val rightAlpha by animateFloatAsState(
                targetValue = if (offsetX > 50f) (offsetX / swipeThreshold).coerceIn(0f, 1f) else 0f
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .alpha(leftAlpha)
                    .background(Color.Red.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(painterResource(Res.drawable.ic_thumb_down), null, tint = Color.White, modifier = Modifier.size(80.dp))
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .alpha(rightAlpha)
                    .background(Color.Green.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(painterResource(Res.drawable.ic_thumb_up), null, tint = Color.White, modifier = Modifier.size(80.dp))
            }

            // Contest banner
            ContestBanner(
                title = "Dance Challenge",
                prizeRc = 5000.0,
                currencyProvider = currencyProvider,
                onJoin = onContestClick,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .windowInsetsPadding(WindowInsets.statusBars)
                    .padding(top = 60.dp, start = 16.dp)
            )

            // Bottom info
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .windowInsetsPadding(WindowInsets.navigationBars)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))
                        )
                    )
                    .padding(start = 16.dp, end = 80.dp, bottom = 24.dp, top = 40.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(
                        model = submission.user.avatarUrl,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp).clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Text(
                            submission.user.displayName,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        Text(
                            "@${submission.user.username}",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // ── RIGHT ACTION PANEL (Contests: Profile view, Upvote, Comment, Bookmark, Share) ──
            Column(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .windowInsetsPadding(WindowInsets.navigationBars)
                    .padding(end = 12.dp, bottom = 80.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Profile (view only, no admire for contests)
                ProfileViewButton(
                    avatarUrl = submission.user.avatarUrl,
                    onClick = onProfileClick
                )

                // Upvote
                ActionButton(
                    icon = {
                        Icon(
                            painterResource(Res.drawable.ic_thumb_up),
                            contentDescription = "Upvote",
                            tint = Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    },
                    label = formatCount(submission.votes),
                    onClick = onUpvote
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
                    label = "Comment",
                    onClick = onComment
                )

                // Bookmark
                ActionButton(
                    icon = {
                        Icon(
                            painterResource(Res.drawable.ic_bookmark_border),
                            contentDescription = "Save",
                            tint = Color.White,
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
    private fun ProfileViewButton(
        avatarUrl: String?,
        onClick: () -> Unit
    ) {
        AsyncImage(
            model = avatarUrl,
            contentDescription = "View Profile",
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .clickable(onClick = onClick)
                .border(2.dp, Color.White, CircleShape),
            contentScale = ContentScale.Crop
        )
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
    private fun ContestBanner(
        title: String,
        prizeKr: Double,
        currencyProvider: UserCurrencyProvider,
        onJoin: () -> Unit,
        modifier: Modifier = Modifier
    ) {
        Card(
            modifier = modifier.width(280.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.Transparent
            )
        ) {
            Box(
                modifier = Modifier
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(Color(0xFFFFD700), Color(0xFFFF6B6B))
                        )
                    )
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("🏆", fontSize = 20.sp)
                        Text(
                            title,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            currencyProvider.formatWithFiat(prizeKr),
                            color = Color.White,
                            fontSize = 12.sp
                        )
                    }
                    Button(
                        onClick = onJoin,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Join", color = Color.Red, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
