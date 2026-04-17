package com.krieta.com.core.ui.components

import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
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
    val player = remember {
        AVPlayer(uRL = NSURL.URLWithString(url)!!).apply {
            actionAtItemEnd = AVPlayerActionAtItemEndNone
        }
    }

    LaunchedEffect(isPlaying) {
        if (isPlaying) {
            player.play()
        } else {
            player.pause()
        }
    }

    DisposableEffect(Unit) {
        val observer = player.addPeriodicTimeObserverForInterval(
            interval = CMTimeMake(1, 1),
            queue = null
        ) { _ ->
            onPlaybackStateChanged(player.rate > 0)
        }
        
        onDispose {
            player.removeTimeObserver(observer)
            player.pause()
        }
    }

    UIKitView(
        factory = {
            val playerViewController = AVPlayerViewController()
            playerViewController.player = player
            playerViewController.showsPlaybackControls = false
            playerViewController.view
        },
        modifier = modifier
    )
}
