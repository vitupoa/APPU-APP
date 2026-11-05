package com.runinga.com.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage

@Composable
fun AdaptiveMediaPlayer(
    mediaType: String,
    videoUrl: String?,
    imageUrl: String?,
    thumbnailUrl: String?,
    aspectRatio: Float?,
    isPlaying: Boolean,
    onPlayingChange: (Boolean) -> Unit,
    onComplete: () -> Unit,
    onPositionChange: (Long, Long) -> Unit,
    modifier: Modifier = Modifier
) {
    when (mediaType) {
        "VIDEO" -> {
            if (videoUrl != null) {
                AdaptiveVideoPlayer(
                    videoUrl = videoUrl,
                    thumbnailUrl = thumbnailUrl,
                    aspectRatio = aspectRatio,
                    isPlaying = isPlaying,
                    onPlayingChange = onPlayingChange,
                    onComplete = onComplete,
                    onPositionChange = onPositionChange,
                    modifier = modifier
                )
            }
        }
        "PHOTO" -> {
            if (imageUrl != null) {
                ZoomableImage(
                    imageUrl = imageUrl,
                    aspectRatio = aspectRatio,
                    modifier = modifier
                )
            }
        }
    }
}

@Composable
fun AdaptiveVideoPlayer(
    videoUrl: String,
    thumbnailUrl: String?,
    aspectRatio: Float?,
    isPlaying: Boolean,
    onPlayingChange: (Boolean) -> Unit,
    onComplete: () -> Unit,
    onPositionChange: (Long, Long) -> Unit,
    modifier: Modifier = Modifier
) {
    val ratio = aspectRatio ?: 0.5625f // Default 9:16

    when {
        ratio > 1.5f -> {
            // Landscape video (16:9) - Letterbox with blurred background
            Box(modifier = modifier.fillMaxSize().background(Color.Black)) {
                // Blurred background
                AsyncImage(
                    model = thumbnailUrl ?: videoUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize().blur(20.dp),
                    contentScale = ContentScale.Crop,
                    alpha = 0.3f
                )
                // Centered video
                VideoPlayer(
                    url = videoUrl,
                    isPlaying = isPlaying,
                    onPlaybackStateChanged = onPlayingChange,
                    onProgressUpdate = onPositionChange,
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(ratio)
                        .align(Alignment.Center)
                )
            }
        }
        ratio < 0.8f -> {
            // Vertical video (9:16 or taller) - Fill screen
            VideoPlayer(
                url = videoUrl,
                isPlaying = isPlaying,
                onPlaybackStateChanged = onPlayingChange,
                onProgressUpdate = onPositionChange,
                modifier = modifier.fillMaxSize()
            )
        }
        else -> {
            // Square-ish (1:1) - Letterbox
            Box(modifier = modifier.fillMaxSize().background(Color.Black)) {
                AsyncImage(
                    model = thumbnailUrl ?: videoUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize().blur(20.dp),
                    contentScale = ContentScale.Crop,
                    alpha = 0.3f
                )
                VideoPlayer(
                    url = videoUrl,
                    isPlaying = isPlaying,
                    onPlaybackStateChanged = onPlayingChange,
                    onProgressUpdate = onPositionChange,
                    modifier = Modifier
                        .fillMaxSize()
                        .aspectRatio(ratio)
                        .align(Alignment.Center)
                )
            }
        }
    }
}

@Composable
fun ZoomableImage(
    imageUrl: String,
    aspectRatio: Float?,
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableStateOf(1f) }
    var offsetX by remember { mutableStateOf(0f) }
    var offsetY by remember { mutableStateOf(0f) }

    val ratio = aspectRatio ?: 1f

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 3f)
                    if (scale > 1f) {
                        offsetX += pan.x
                        offsetY += pan.y
                    } else {
                        offsetX = 0f
                        offsetY = 0f
                    }
                }
            }
    ) {
        AsyncImage(
            model = imageUrl,
            contentDescription = null,
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(
                    scaleX = scale,
                    scaleY = scale,
                    translationX = offsetX,
                    translationY = offsetY
                ),
            contentScale = if (ratio > 1.5f || ratio < 0.8f) ContentScale.Fit else ContentScale.Crop
        )
    }
}
