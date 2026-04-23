package com.krieta.com.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.interop.UIKitView
import com.krieta.com.core.theme.KrietaColors
import kotlinx.cinterop.ExperimentalForeignApi
import platform.AVFoundation.*
import platform.AVKit.AVPlayerViewController
import platform.Foundation.NSURL
import platform.UIKit.UIView

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun VideoPlayer(
    url: String,
    isPlaying: Boolean,
    modifier: Modifier,
    onPlaybackStateChanged: (Boolean) -> Unit
) {
    var isBuffering by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }
    
    val player = remember(url) {
        AVPlayer(uRL = NSURL.URLWithString(url)!!).apply {
            actionAtItemEnd = AVPlayerActionAtItemEndNone
        }
    }

    LaunchedEffect(isPlaying) {
        if (!hasError) {
            if (isPlaying) {
                platform.UIKit.UIApplication.sharedApplication.idleTimerDisabled = true
                player.play()
            } else {
                platform.UIKit.UIApplication.sharedApplication.idleTimerDisabled = false
                player.pause()
            }
        }
    }
    
    LaunchedEffect(url) {
        hasError = false
        isBuffering = true
    }

    DisposableEffect(url) {
        val statusObserver = player.currentItem?.addObserver(
            forKeyPath = "status",
            options = 0u,
            context = null
        )
        
        val observer = player.addPeriodicTimeObserverForInterval(
            interval = CMTimeMake(1, 1),
            queue = null
        ) { _ ->
            val status = player.currentItem?.status ?: AVPlayerItemStatusUnknown
            when (status) {
                AVPlayerItemStatusReadyToPlay -> {
                    isBuffering = false
                    hasError = false
                }
                AVPlayerItemStatusFailed -> {
                    isBuffering = false
                    hasError = true
                }
                else -> {
                    isBuffering = true
                }
            }
            onPlaybackStateChanged(player.rate > 0)
        }
        
        onDispose {
            platform.UIKit.UIApplication.sharedApplication.idleTimerDisabled = false
            player.removeTimeObserver(observer)
            player.pause()
        }
    }

    Box(modifier = modifier) {
        UIKitView(
            factory = {
                val playerViewController = AVPlayerViewController()
                playerViewController.player = player
                playerViewController.showsPlaybackControls = false
                playerViewController.view
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
                CircularProgressIndicator(color = KrietaColors.primary)
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
