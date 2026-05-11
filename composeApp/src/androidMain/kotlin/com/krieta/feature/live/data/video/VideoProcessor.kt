package com.krieta.feature.live.data.video

import android.content.Context
import android.graphics.*
import android.renderscript.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

actual class VideoProcessor(private val context: Context) {
    private var renderScript: RenderScript? = null
    private var blurScript: ScriptIntrinsicBlur? = null
    private var blurIntensity: Float = 0.8f
    private var blurEnabled: Boolean = true
    
    private val _inputAspectRatio = MutableStateFlow(AspectRatio.RATIO_9_16)
    actual val inputAspectRatio: StateFlow<AspectRatio> = _inputAspectRatio.asStateFlow()
    
    // Target output: 9:16 (1080x1920 or 720x1280)
    private val targetWidth = 1080
    private val targetHeight = 1920
    
    actual fun initialize() {
        renderScript = RenderScript.create(context)
        blurScript = ScriptIntrinsicBlur.create(renderScript, Element.U8_4(renderScript))
    }
    
    actual fun processFrame(frame: Any): Any {
        if (frame !is Bitmap) return frame
        
        val inputWidth = frame.width
        val inputHeight = frame.height
        val inputRatio = inputWidth.toFloat() / inputHeight.toFloat()
        
        _inputAspectRatio.value = AspectRatio(inputWidth, inputHeight)
        
        // If already 9:16, return as is
        if (kotlin.math.abs(inputRatio - 0.5625f) < 0.01f) {
            return frame
        }
        
        // Create 9:16 output bitmap
        val outputBitmap = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(outputBitmap)
        
        if (blurEnabled) {
            // Step 1: Draw blurred background (stretched to fill)
            val blurredBg = createBlurredBackground(frame)
            canvas.drawBitmap(blurredBg, null, Rect(0, 0, targetWidth, targetHeight), null)
            blurredBg.recycle()
        } else {
            // Solid black background
            canvas.drawColor(Color.BLACK)
        }
        
        // Step 2: Draw original content centered (fit to screen)
        val contentRect = calculateCenterFitRect(inputWidth, inputHeight, targetWidth, targetHeight)
        canvas.drawBitmap(frame, null, contentRect, Paint(Paint.ANTI_ALIAS_FLAG))
        
        return outputBitmap
    }
    
    actual fun setBlurIntensity(intensity: Float) {
        blurIntensity = intensity.coerceIn(0f, 1f)
    }
    
    actual fun setBlurEnabled(enabled: Boolean) {
        blurEnabled = enabled
    }
    
    actual fun release() {
        blurScript?.destroy()
        renderScript?.destroy()
        renderScript = null
        blurScript = null
    }
    
    private fun createBlurredBackground(source: Bitmap): Bitmap {
        // Downscale for performance
        val scaleFactor = 0.25f
        val smallWidth = (source.width * scaleFactor).toInt()
        val smallHeight = (source.height * scaleFactor).toInt()
        val smallBitmap = Bitmap.createScaledBitmap(source, smallWidth, smallHeight, true)
        
        // Apply blur
        val blurred = applyBlur(smallBitmap, (25f * blurIntensity).coerceIn(1f, 25f))
        smallBitmap.recycle()
        
        // Darken for better contrast
        val darkened = Bitmap.createBitmap(blurred.width, blurred.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(darkened)
        val paint = Paint().apply {
            colorFilter = ColorMatrixColorFilter(ColorMatrix().apply {
                setScale(0.5f, 0.5f, 0.5f, 1f) // 50% brightness
            })
        }
        canvas.drawBitmap(blurred, 0f, 0f, paint)
        blurred.recycle()
        
        return darkened
    }
    
    private fun applyBlur(bitmap: Bitmap, radius: Float): Bitmap {
        val output = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        
        val rs = renderScript ?: return bitmap
        val blur = blurScript ?: return bitmap
        
        val input = Allocation.createFromBitmap(rs, bitmap)
        val outputAlloc = Allocation.createFromBitmap(rs, output)
        
        blur.setRadius(radius)
        blur.setInput(input)
        blur.forEach(outputAlloc)
        
        outputAlloc.copyTo(output)
        
        input.destroy()
        outputAlloc.destroy()
        
        return output
    }
    
    private fun calculateCenterFitRect(
        srcWidth: Int,
        srcHeight: Int,
        dstWidth: Int,
        dstHeight: Int
    ): Rect {
        val srcRatio = srcWidth.toFloat() / srcHeight.toFloat()
        val dstRatio = dstWidth.toFloat() / dstHeight.toFloat()
        
        val (scaledWidth, scaledHeight) = if (srcRatio > dstRatio) {
            // Source is wider, fit to width
            val w = dstWidth
            val h = (dstWidth / srcRatio).toInt()
            w to h
        } else {
            // Source is taller, fit to height
            val w = (dstHeight * srcRatio).toInt()
            val h = dstHeight
            w to h
        }
        
        val left = (dstWidth - scaledWidth) / 2
        val top = (dstHeight - scaledHeight) / 2
        
        return Rect(left, top, left + scaledWidth, top + scaledHeight)
    }
}
