package com.krieta.com.core.ui.components

import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.krieta.com.core.theme.KrietaColors

@Composable
actual fun VideoPlayer(
    url: String,
    isPlaying: Boolean,
    modifier: Modifier,
    onPlaybackStateChanged: (Boolean) -> Unit
) {
    val context = LocalContext.current
    var isBuffering by remember { mutableStateOf(false) }
    var hasError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    
    val exoPlayer = remember(url) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(url))
            prepare()
            playWhenReady = isPlaying
            repeatMode = Player.REPEAT_MODE_ONE
            
            addListener(object : Player.Listener {
                override fun onIsPlayingChanged(playing: Boolean) {
                    onPlaybackStateChanged(playing)
                }
                
                override fun onPlaybackStateChanged(playbackState: Int) {
                    isBuffering = playbackState == Player.STATE_BUFFERING
                    hasError = playbackState == Player.STATE_IDLE && errorMessage.isNotEmpty()
                }
                
                override fun onPlayerError(error: PlaybackException) {
                    hasError = true
                    errorMessage = error.message ?: "Video playback error"
                    println("ExoPlayer Error: ${error.message}")
                }
            })
        }
    }

    LaunchedEffect(isPlaying) {
        if (!hasError) {
            exoPlayer.playWhenReady = isPlaying
        }
    }
    
    LaunchedEffect(url) {
        hasError = false
        errorMessage = ""
        isBuffering = true
    }

    DisposableEffect(url) {
        onDispose {
            exoPlayer.release()
        }
    }

    Box(modifier = modifier) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = exoPlayer
                    useController = false
                    layoutParams = FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }
            },
            modifier = Modifier.fillMaxSize()
        )
        
        // Buffering indicator
        if (isBuffering && !hasError) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = KrietaColors.Primary)
            }
        }
        
        // Error state
        if (hasError) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.7f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Failed to load video",
                    color = Color.White
                )
            }
        }
    }
}
