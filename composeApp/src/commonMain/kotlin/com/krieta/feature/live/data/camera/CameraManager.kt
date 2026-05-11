package com.krieta.feature.live.data.camera

/**
 * Camera Manager for Live Streaming
 * Handles camera initialization, switching, and streaming
 */
expect class CameraManager {
    /**
     * Initialize camera with specified facing
     * @param useFrontCamera true for front camera, false for back camera
     */
    fun initializeCamera(useFrontCamera: Boolean)
    
    /**
     * Start camera preview and streaming
     */
    fun startCamera()
    
    /**
     * Stop camera preview and streaming
     */
    fun stopCamera()
    
    /**
     * Switch between front and back camera
     */
    fun switchCamera()
    
    /**
     * Pause video streaming (keeps camera active)
     */
    fun pauseStream()
    
    /**
     * Resume video streaming
     */
    fun resumeStream()
    
    /**
     * Check if camera is currently active
     */
    fun isCameraActive(): Boolean
    
    /**
     * Check if currently using front camera
     */
    fun isFrontCamera(): Boolean
    
    /**
     * Release camera resources
     */
    fun release()
}

/**
 * Camera state for UI
 */
data class CameraState(
    val isActive: Boolean = false,
    val isFrontCamera: Boolean = true,
    val isStreaming: Boolean = false,
    val error: String? = null
)
