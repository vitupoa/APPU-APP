package com.krieta.com.core.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/**
 * Expect/Actual VideoPlayer for platform-specific video playback
 * Android: ExoPlayer
 * iOS: AVPlayer
 */
@Composable
expect fun VideoPlayer(
    url: String,
    isPlaying: Boolean,
    modifier: Modifier = Modifier,
    onPlaybackStateChanged: (Boolean) -> Unit = {},
    onProgressUpdate: (currentPosition: Long, duration: Long) -> Unit = { _, _ -> },
    seekToPosition: Long? = null
)
