package com.krieta.feature.live.data.webrtc

import kotlinx.coroutines.flow.StateFlow

/**
 * WebRTC Manager for Live Streaming
 * Handles peer connection, video/audio streaming
 */
expect class WebRTCManager {
    /**
     * Initialize WebRTC with stream configuration
     */
    fun initialize(streamKey: String, streamUrl: String)
    
    /**
     * Start streaming video/audio
     */
    suspend fun startStreaming(): Result<Unit>
    
    /**
     * Stop streaming
     */
    fun stopStreaming()
    
    /**
     * Mute/unmute audio
     */
    fun setAudioEnabled(enabled: Boolean)
    
    /**
     * Enable/disable video
     */
    fun setVideoEnabled(enabled: Boolean)
    
    /**
     * Switch camera (front/back)
     */
    fun switchCamera()
    
    /**
     * Get connection state
     */
    val connectionState: StateFlow<WebRTCState>
    
    /**
     * Release resources
     */
    fun release()
}

enum class WebRTCState {
    IDLE,
    CONNECTING,
    CONNECTED,
    DISCONNECTED,
    FAILED,
    RECONNECTING
}

data class StreamConfig(
    val streamKey: String,
    val streamUrl: String,
    val videoBitrate: Int = 2500, // kbps
    val audioBitrate: Int = 128, // kbps
    val videoWidth: Int = 720,
    val videoHeight: Int = 1280,
    val fps: Int = 30,
    val keyFrameInterval: Int = 2, // seconds
    val enableAdaptiveBitrate: Boolean = true
)

data class NetworkQuality(
    val bandwidth: Long, // bytes per second
    val rtt: Long, // round trip time in ms
    val packetLoss: Float // percentage
)
