package com.krieta.feature.contests.presentation.screen

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
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
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.ui.components.TippingModal
import com.krieta.com.core.ui.components.VideoPlayer
import com.krieta.feature.contests.domain.model.ContestSubmission
import com.krieta.feature.contests.presentation.viewmodel.ContestSubmissionFeedViewModel
import org.koin.compose.koinInject
import org.koin.core.parameter.parametersOf
import kotlin.math.abs

class ContestSubmissionFeedScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ContestSubmissionFeedViewModel> { parametersOf(null) }
        val state by viewModel.state.collectAsState()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        
        val pagerState = rememberPagerState(pageCount = { state.submissions.size })

        LaunchedEffect(pagerState.currentPage) {
            if (pagerState.currentPage >= state.submissions.size - 3 && !state.isLoadingMore) {
                viewModel.loadMore()
            }
        }

        Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
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
                        SubmissionItem(
                            submission = submission,
                            isActive = page == pagerState.currentPage,
                            onUpvote = { viewModel.upvoteSubmission(submission.id) },
                            onDownvote = { viewModel.downvoteSubmission(submission.id) },
                            onComment = { /* Open comments */ },
                            onShare = { /* Handle share */ },
                            onContestClick = { navigator.push(ContestDetailScreen(submission.contestId)) },
                            currencyProvider = currencyProvider
                        )
                    }
                }
            }
        }
    }

    @Composable
    private fun SubmissionItem(
        submission: ContestSubmission,
        isActive: Boolean,
        onUpvote: () -> Unit,
        onDownvote: () -> Unit,
        onComment: () -> Unit,
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
                
                LaunchedEffect(isActive) {
                    isPlaying = isActive
                }
                
                VideoPlayer(
                    url = submission.mediaUrl,
                    isPlaying = isPlaying,
                    modifier = Modifier.fillMaxSize(),
                    onPlaybackStateChanged = { playing ->
                        isPlaying = playing
                    }
                )
            } else {
                AsyncImage(
                    model = submission.mediaUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
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
                Icon(Icons.Default.ThumbDown, null, tint = Color.White, modifier = Modifier.size(80.dp))
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .alpha(rightAlpha)
                    .background(Color.Green.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.ThumbUp, null, tint = Color.White, modifier = Modifier.size(80.dp))
            }

            // Contest banner
            ContestBanner(
                title = "Dance Challenge",
                prizeKr = 5000.0,
                currencyProvider = currencyProvider,
                onJoin = onContestClick,
                modifier = Modifier.align(Alignment.TopStart).padding(top = 110.dp, start = 16.dp)
            )

            // Bottom info
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))
                        )
                    )
                    .padding(16.dp)
                    .padding(bottom = 32.dp)
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

            // Right action buttons (NO TIP BUTTON for contests)
            Column(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 12.dp, bottom = 80.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                ActionButton(
                    icon = Icons.Default.ThumbUp,
                    count = submission.votes,
                    onClick = onUpvote
                )
                ActionButton(
                    icon = Icons.AutoMirrored.Filled.Comment,
                    count = 0,
                    onClick = onComment
                )
                ActionButton(
                    icon = Icons.Default.Share,
                    count = 0,
                    onClick = onShare
                )
            }
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

    @Composable
    private fun ActionButton(
        icon: androidx.compose.ui.graphics.vector.ImageVector,
        count: Int?,
        onClick: () -> Unit,
        label: String? = null
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(56.dp)
        ) {
            IconButton(onClick = onClick) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }
            if (count != null) {
                Text(
                    "$count",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            } else if (label != null) {
                Text(
                    label,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
