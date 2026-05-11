package com.krieta.feature.live.data.video

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Video Processor for immersive 9:16 streaming
 * Handles aspect ratio adaptation with blurred background
 */
expect class VideoProcessor {
    /**
     * Initialize video processor
     */
    fun initialize()
    
    /**
     * Process video frame to 9:16 with blur effect
     * @param frame Input video frame
     * @return Processed frame in 9:16 format
     */
    fun processFrame(frame: Any): Any
    
    /**
     * Set blur intensity for background
     * @param intensity 0.0 (no blur) to 1.0 (max blur)
     */
    fun setBlurIntensity(intensity: Float)
    
    /**
     * Enable/disable blur effect
     */
    fun setBlurEnabled(enabled: Boolean)
    
    /**
     * Get current aspect ratio of input
     */
    val inputAspectRatio: StateFlow<AspectRatio>
    
    /**
     * Release resources
     */
    fun release()
}

data class AspectRatio(
    val width: Int,
    val height: Int,
    val ratio: Float = width.toFloat() / height.toFloat(),
    val isPortrait: Boolean = height > width
) {
    companion object {
        val RATIO_9_16 = AspectRatio(9, 16, 0.5625f, true)
        val RATIO_16_9 = AspectRatio(16, 9, 1.7778f, false)
        val RATIO_4_3 = AspectRatio(4, 3, 1.3333f, false)
        val RATIO_1_1 = AspectRatio(1, 1, 1.0f, false)
    }
    
    fun needsBlurBackground(): Boolean {
        // If not 9:16, needs blur background
        return kotlin.math.abs(ratio - RATIO_9_16.ratio) > 0.01f
    }
}

enum class ScaleMode {
    FIT_CENTER,      // Fit content with blur background
    CROP_CENTER,     // Crop to fill 9:16
    STRETCH          // Stretch to 9:16 (not recommended)
}
