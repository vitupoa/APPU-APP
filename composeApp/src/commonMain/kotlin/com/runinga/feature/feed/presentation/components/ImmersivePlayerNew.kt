package com.runinga.feature.feed.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.runinga.com.core.ui.components.AdaptiveMediaPlayer
import com.runinga.com.core.ui.components.PhotoCarousel
import com.runinga.com.core.util.currentTimeMillis
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ImmersivePlayer(
    videoUrl: String,
    thumbnailUrl: String?,
    mediaType: String = "VIDEO",
    aspectRatio: Float? = null,
    mediaUrls: List<String> = emptyList(),
    caption: String?,
    creatorName: String,
    creatorAvatar: String?,
    creatorId: String,
    isAdmired: Boolean,
    likesCount: Int,
    commentsCount: Int,
    isLiked: Boolean,
    isLocked: Boolean = false,
    isContest: Boolean = false,
    isAd: Boolean = false,
    showTipButton: Boolean = true,
    onLike: () -> Unit,
    onComment: () -> Unit,
    onShare: () -> Unit,
    onAdmire: () -> Unit,
    onTip: () -> Unit = {},
    onCreatorClick: () -> Unit,
    onSoundClick: () -> Unit,
    onVideoComplete: () -> Unit,
    onViewTracked: (watchDuration: Long, totalDuration: Long) -> Unit,
    modifier: Modifier = Modifier
) {
    var isPlaying by remember { mutableStateOf(true) }
    var showLikeAnimation by remember { mutableStateOf(false) }
    var watchStartTime by remember { mutableStateOf(currentTimeMillis()) }
    var currentPosition by remember { mutableStateOf(0L) }
    var videoDuration by remember { mutableStateOf(0L) }
    val scope = rememberCoroutineScope()

    // Track view when video is 3+ seconds watched
    LaunchedEffect(currentPosition) {
        if (currentPosition >= 3000 && watchStartTime > 0) {
            onViewTracked(currentPosition, videoDuration)
            watchStartTime = 0 // Track only once
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = { offset ->
                        // Center tap: pause/play
                        val centerX = size.width / 2
                        val tapX = offset.x
                        if (tapX > centerX - 100 && tapX < centerX + 100) {
                            isPlaying = !isPlaying
                        }
                    },
                    onDoubleTap = {
                        // Double tap: like
                        onLike()
                        showLikeAnimation = true
                        scope.launch {
                            delay(1000)
                            showLikeAnimation = false
                        }
                    },
                    onLongPress = {
                        // Long press: show options menu
                        // TODO: Implement options menu
                    }
                )
            }
    ) {
        // Adaptive Media Player (handles videos, photos, and carousels with different aspect ratios)
        if (mediaType == "CAROUSEL" && mediaUrls.isNotEmpty()) {
            PhotoCarousel(
                photos = mediaUrls,
                aspectRatio = aspectRatio,
                isActive = isPlaying,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            AdaptiveMediaPlayer(
                mediaType = mediaType,
                videoUrl = if (mediaType == "VIDEO") videoUrl else null,
                imageUrl = if (mediaType == "PHOTO") videoUrl else null,
                thumbnailUrl = thumbnailUrl,
                aspectRatio = aspectRatio,
                isPlaying = isPlaying,
                onPlayingChange = { isPlaying = it },
                onComplete = onVideoComplete,
                onPositionChange = { position, duration ->
                    currentPosition = position
                    videoDuration = duration
                },
                modifier = Modifier.fillMaxSize()
            )
        }

        // Like Animation Overlay
        if (showLikeAnimation) {
            Icon(
                imageVector = Icons.Default.Favorite,
                contentDescription = null,
                tint = Color.Red,
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(120.dp)
            )
        }

        // Bottom Overlay (Left Side) - Creator Info & Caption
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
                .fillMaxWidth(0.7f)
        ) {
            // Creator Info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                // Creator Avatar with + button
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .pointerInput(Unit) {
                            detectTapGestures(onTap = { onCreatorClick() })
                        }
                ) {
                    // Avatar (placeholder - use actual image loader)
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // TODO: Load creator avatar
                    }

                    // + Button for Admire/Love
                    if (!isAdmired) {
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .size(20.dp)
                                .align(Alignment.BottomEnd)
                                .pointerInput(Unit) {
                                    detectTapGestures(onTap = { onAdmire() })
                                }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Admire",
                                tint = Color.White,
                                modifier = Modifier.padding(2.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Creator Name
                Text(
                    text = creatorName,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    modifier = Modifier.shadow(4.dp)
                )
            }

            // Caption
            if (!caption.isNullOrBlank()) {
                Text(
                    text = caption,
                    color = Color.White,
                    fontSize = 14.sp,
                    maxLines = 2,
                    modifier = Modifier.shadow(4.dp)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Sound/Music Info (if available)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.pointerInput(Unit) {
                    detectTapGestures(onTap = { onSoundClick() })
                }
            ) {
                Icon(
                    imageVector = Icons.Default.MusicNote,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Original Sound",
                    color = Color.White,
                    fontSize = 12.sp,
                    modifier = Modifier.shadow(4.dp)
                )
            }
        }

        // Right Side Actions
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp),
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 16.dp, bottom = 80.dp)
        ) {
            // Like Button
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(onClick = onLike) {
                    Icon(
                        imageVector = if (isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Like",
                        tint = if (isLiked) Color.Red else Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
                Text(
                    text = formatCount(likesCount),
                    color = Color.White,
                    fontSize = 12.sp,
                    modifier = Modifier.shadow(4.dp)
                )
            }

            // Comment Button
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(onClick = onComment) {
                    Icon(
                        imageVector = Icons.Default.ChatBubbleOutline,
                        contentDescription = "Comment",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
                Text(
                    text = formatCount(commentsCount),
                    color = Color.White,
                    fontSize = 12.sp,
                    modifier = Modifier.shadow(4.dp)
                )
            }

            // Tip Button (only for shorts, not contests/ads/locked)
            if (showTipButton && !isContest && !isAd && !isLocked) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    IconButton(onClick = onTip) {
                        Icon(
                            imageVector = Icons.Default.AttachMoney,
                            contentDescription = "Tip",
                            tint = Color(0xFFFFD700), // Gold color
                            modifier = Modifier.size(32.dp)
                        )
                    }
                    Text(
                        text = "Tip",
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.shadow(4.dp)
                    )
                }
            }

            // Share Button
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(onClick = onShare) {
                    Icon(
                        imageVector = Icons.Default.Share,
                        contentDescription = "Share",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
        }
    }
}

private fun formatCount(count: Int): String {
    return when {
        count >= 1_000_000 -> "${count / 1_000_000}M"
        count >= 1_000 -> "${count / 1_000}K"
        else -> count.toString()
    }
}
