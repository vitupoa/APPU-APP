package com.krieta.feature.feed.presentation.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.*
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.krieta.com.core.theme.KrietaColors
import com.krieta.com.core.util.currentTimeMillis
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

data class ImmersiveContent(
    val id: String,
    val type: String, // "VIDEO" or "PHOTO"
    val mediaUrl: String,
    val caption: String?,
    val creatorId: String,
    val creatorUsername: String,
    val creatorAvatar: String?,
    val isAdmiring: Boolean,
    val likesCount: Int,
    val commentsCount: Int,
    val sharesCount: Int,
    val isLiked: Boolean,
    val musicTitle: String? = null,
    val musicArtist: String? = null
)

@Composable
fun ImmersivePlayer(
    content: ImmersiveContent,
    isPlaying: Boolean,
    onPlayPauseToggle: () -> Unit,
    onLike: () -> Unit,
    onComment: () -> Unit,
    onShare: () -> Unit,
    onAdmire: () -> Unit,
    onCreatorClick: () -> Unit,
    onMusicClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showLikeAnimation by remember { mutableStateOf(false) }
    var lastTapTime by remember { mutableStateOf(0L) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = {
                        onPlayPauseToggle()
                    },
                    onDoubleTap = {
                        val currentTime = currentTimeMillis()
                        if (currentTime - lastTapTime < 300) {
                            onLike()
                            showLikeAnimation = true
                            scope.launch {
                                delay(1000)
                                showLikeAnimation = false
                            }
                        }
                        lastTapTime = currentTime
                    }
                )
            }
    ) {
        // Media content
        AsyncImage(
            model = content.mediaUrl,
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // Double-tap heart animation
        AnimatedVisibility(
            visible = showLikeAnimation,
            enter = scaleIn() + fadeIn(),
            exit = scaleOut() + fadeOut()
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painterResource(Res.drawable.ic_favorite),
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(120.dp)
                )
            }
        }

        // Bottom overlay - Left side
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth(0.75f)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))
                    )
                )
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box {
                    AsyncImage(
                        model = content.creatorAvatar,
                        contentDescription = null,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .clickable(onClick = onCreatorClick),
                        contentScale = ContentScale.Crop
                    )
                    
                    Surface(
                        modifier = Modifier
                            .size(20.dp)
                            .align(Alignment.BottomEnd)
                            .clickable(onClick = onAdmire),
                        shape = CircleShape,
                        color = if (content.isAdmiring) KrietaColors.Primary else Color.White
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                if (content.isAdmiring) "❤" else "+",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (content.isAdmiring) Color.White else KrietaColors.Primary
                            )
                        }
                    }
                }

                Text(
                    "@${content.creatorUsername}",
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable(onClick = onCreatorClick)
                )
            }

            content.caption?.let {
                Spacer(Modifier.height(8.dp))
                Text(
                    it,
                    color = Color.White,
                    fontSize = 14.sp,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (content.musicTitle != null) {
                Spacer(Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable(onClick = onMusicClick)
                ) {
                    Icon(
                        painterResource(Res.drawable.ic_music_note),
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "${content.musicTitle} - ${content.musicArtist}",
                        color = Color.White,
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        // Right side actions
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
                .padding(bottom = 80.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            ActionButton(
                icon = if (content.isLiked) Res.drawable.ic_favorite else Res.drawable.ic_favorite_border,
                count = content.likesCount,
                tint = if (content.isLiked) Color.Red else Color.White,
                onClick = onLike
            )

            ActionButton(
                icon = Res.drawable.ic_comment,
                count = content.commentsCount,
                tint = Color.White,
                onClick = onComment
            )

            ActionButton(
                icon = Res.drawable.ic_share,
                count = content.sharesCount,
                tint = Color.White,
                onClick = onShare
            )
        }
    }
}

@Composable
private fun ActionButton(
    icon: org.jetbrains.compose.resources.DrawableResource,
    count: Int,
    tint: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                painterResource(icon),
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(32.dp)
            )
        }
        
        if (count > 0) {
            Text(
                formatCount(count),
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
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
