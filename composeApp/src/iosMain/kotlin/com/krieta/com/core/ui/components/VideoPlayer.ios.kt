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
import kotlinx.cinterop.*
import platform.AVFoundation.*
import platform.AVKit.AVPlayerViewController
import platform.CoreMedia.*
import platform.Foundation.*
import platform.UIKit.UIView
import platform.darwin.NSObject

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun VideoPlayer(
    url: String,
    isPlaying: Boolean,
    modifier: Modifier,
    onPlaybackStateChanged: (Boolean) -> Unit,
    onProgressUpdate: (currentPosition: Long, duration: Long) -> Unit,
    seekToPosition: Long?
) {
    var isBuffering by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    
    val player = remember(url) {
        AVPlayer(uRL = NSURL.URLWithString(url)!!).apply {
            // Loop video
            actionAtItemEnd = AVPlayerActionAtItemEndNone
            
            // Observe when video ends to loop
            NSNotificationCenter.defaultCenter.addObserverForName(
                name = AVPlayerItemDidPlayToEndTimeNotification,
                `object` = currentItem,
                queue = null
            ) { _ ->
                seekToTime(kCMTimeZero.readValue())
                if (isPlaying) play()
            }
        }
    }

    // Handle play/pause
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
    
    // Handle seek
    LaunchedEffect(seekToPosition) {
        seekToPosition?.let { position ->
            val time = CMTimeMakeWithSeconds(position.toDouble() / 1000.0, 600)
            player.seekToTime(time.readValue(), toleranceBefore = kCMTimeZero.readValue(), toleranceAfter = kCMTimeZero.readValue())
        }
    }
    
    // Reset state on URL change
    LaunchedEffect(url) {
        hasError = false
        errorMessage = ""
        isBuffering = true
    }

    DisposableEffect(url) {
        // Observe player item status
        val statusObserver = object : NSObject() {
            @Suppress("UNUSED_PARAMETER")
            fun observeValueForKeyPath(
                keyPath: String?,
                ofObject: Any?,
                change: Map<Any?, *>?,
                context: COpaquePointer?
            ) {
                if (keyPath == "status") {
                    val status = player.currentItem?.status ?: AVPlayerItemStatusUnknown
                    when (status) {
                        AVPlayerItemStatusReadyToPlay -> {
                            isBuffering = false
                            hasError = false
                        }
                        AVPlayerItemStatusFailed -> {
                            isBuffering = false
                            hasError = true
                            errorMessage = player.currentItem?.error?.localizedDescription ?: "Unknown error"
                            println("AVPlayer Error: $errorMessage")
                        }
                        else -> {
                            isBuffering = true
                        }
                    }
                }
            }
        }
        
        player.currentItem?.addObserver(
            statusObserver,
            forKeyPath = "status",
            options = NSKeyValueObservingOptionNew,
            context = null
        )
        
        // Periodic time observer for progress updates
        val timeObserver = player.addPeriodicTimeObserverForInterval(
            interval = CMTimeMakeWithSeconds(0.1, 600), // Update every 100ms
            queue = null
        ) { time ->
            // Update playback state
            onPlaybackStateChanged(player.rate > 0.0)
            
            // Update progress
            val currentSeconds = CMTimeGetSeconds(time)
            val currentMs = if (currentSeconds.isFinite()) {
                (currentSeconds * 1000).toLong()
            } else {
                0L
            }
            
            val duration = player.currentItem?.duration
            val durationSeconds = duration?.let { CMTimeGetSeconds(it) } ?: 0.0
            val durationMs = if (durationSeconds.isFinite()) {
                (durationSeconds * 1000).toLong()
            } else {
                0L
            }
            
            onProgressUpdate(currentMs, durationMs)
        }
        
        onDispose {
            platform.UIKit.UIApplication.sharedApplication.idleTimerDisabled = false
            player.currentItem?.removeObserver(statusObserver, forKeyPath = "status")
            player.removeTimeObserver(timeObserver)
            player.pause()
            player.replaceCurrentItemWithPlayerItem(null)
        }
    }

    Box(modifier = modifier) {
        UIKitView(
            factory = {
                val playerViewController = AVPlayerViewController()
                playerViewController.player = player
                playerViewController.showsPlaybackControls = false
                playerViewController.videoGravity = AVLayerVideoGravityResizeAspectFill
                playerViewController.view.apply {
                    backgroundColor = platform.UIKit.UIColor.blackColor
                }
                playerViewController.view
            },
            modifier = Modifier.fillMaxSize(),
            update = { view ->
                // Update player if needed
            }
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
