package com.krieta.feature.live.data.video

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import platform.CoreGraphics.*
import platform.CoreImage.*
import platform.UIKit.*
import platform.Foundation.*
import kotlinx.cinterop.*

actual class VideoProcessor {
    private var ciContext: CIContext? = null
    private var blurIntensity: Float = 0.8f
    private var blurEnabled: Boolean = true
    
    private val _inputAspectRatio = MutableStateFlow(AspectRatio.RATIO_9_16)
    actual val inputAspectRatio: StateFlow<AspectRatio> = _inputAspectRatio.asStateFlow()
    
    // Target output: 9:16 (1080x1920 or 720x1280)
    private val targetWidth = 1080.0
    private val targetHeight = 1920.0
    
    actual fun initialize() {
        ciContext = CIContext()
    }
    
    actual fun processFrame(frame: Any): Any {
        if (frame !is CIImage && frame !is UIImage) return frame
        
        val ciImage = when (frame) {
            is CIImage -> frame
            is UIImage -> CIImage.imageWithCGImage(frame.CGImage!!)
            else -> return frame
        }
        
        val inputWidth = ciImage.extent.size.width
        val inputHeight = ciImage.extent.size.height
        val inputRatio = (inputWidth / inputHeight).toFloat()
        
        _inputAspectRatio.value = AspectRatio(inputWidth.toInt(), inputHeight.toInt())
        
        // If already 9:16, return as is
        if (kotlin.math.abs(inputRatio - 0.5625f) < 0.01f) {
            return frame
        }
        
        // Create 9:16 output
        val outputImage = if (blurEnabled) {
            createImmersiveFrameWithBlur(ciImage)
        } else {
            createImmersiveFrameWithBlack(ciImage)
        }
        
        return outputImage
    }
    
    actual fun setBlurIntensity(intensity: Float) {
        blurIntensity = intensity.coerceIn(0f, 1f)
    }
    
    actual fun setBlurEnabled(enabled: Boolean) {
        blurEnabled = enabled
    }
    
    actual fun release() {
        ciContext = null
    }
    
    private fun createImmersiveFrameWithBlur(source: CIImage): CIImage {
        // Step 1: Create blurred background
        val blurFilter = CIFilter.filterWithName("CIGaussianBlur")!!
        blurFilter.setValue(source, forKey = "inputImage")
        blurFilter.setValue(NSNumber(25.0 * blurIntensity), forKey = "inputRadius")
        
        var blurredBg = blurFilter.outputImage!!
        
        // Step 2: Darken background for contrast
        val darkenFilter = CIFilter.filterWithName("CIColorControls")!!
        darkenFilter.setValue(blurredBg, forKey = "inputImage")
        darkenFilter.setValue(NSNumber(0.5), forKey = "inputBrightness") // 50% darker
        blurredBg = darkenFilter.outputImage!!
        
        // Step 3: Scale background to fill 9:16
        val bgScaleX = targetWidth / source.extent.size.width
        val bgScaleY = targetHeight / source.extent.size.height
        val bgScale = maxOf(bgScaleX, bgScaleY)
        
        val bgTransform = CGAffineTransformMakeScale(bgScale, bgScale)
        blurredBg = blurredBg.imageByApplyingTransform(bgTransform)
        
        // Center crop background
        val bgCropRect = CGRectMake(
            (blurredBg.extent.size.width - targetWidth) / 2.0,
            (blurredBg.extent.size.height - targetHeight) / 2.0,
            targetWidth,
            targetHeight
        )
        blurredBg = blurredBg.imageByCroppingToRect(bgCropRect)
        
        // Step 4: Calculate center fit for original content
        val contentRect = calculateCenterFitRect(
            source.extent.size.width,
            source.extent.size.height,
            targetWidth,
            targetHeight
        )
        
        // Scale original content
        val contentScaleX = contentRect.size.width / source.extent.size.width
        val contentScaleY = contentRect.size.height / source.extent.size.height
        val contentScale = minOf(contentScaleX, contentScaleY)
        
        val contentTransform = CGAffineTransformMakeScale(contentScale, contentScale)
        var scaledContent = source.imageByApplyingTransform(contentTransform)
        
        // Translate to center
        val translateX = contentRect.origin.x
        val translateY = contentRect.origin.y
        val translateTransform = CGAffineTransformMakeTranslation(translateX, translateY)
        scaledContent = scaledContent.imageByApplyingTransform(translateTransform)
        
        // Step 5: Composite content over blurred background
        val compositeFilter = CIFilter.filterWithName("CISourceOverCompositing")!!
        compositeFilter.setValue(scaledContent, forKey = "inputImage")
        compositeFilter.setValue(blurredBg, forKey = "inputBackgroundImage")
        
        return compositeFilter.outputImage!!
    }
    
    private fun createImmersiveFrameWithBlack(source: CIImage): CIImage {
        // Create black background
        val blackColor = CIColor.colorWithRed(0.0, green = 0.0, blue = 0.0, alpha = 1.0)
        val blackFilter = CIFilter.filterWithName("CIConstantColorGenerator")!!
        blackFilter.setValue(blackColor, forKey = "inputColor")
        var blackBg = blackFilter.outputImage!!
        
        // Crop to 9:16
        val bgRect = CGRectMake(0.0, 0.0, targetWidth, targetHeight)
        blackBg = blackBg.imageByCroppingToRect(bgRect)
        
        // Calculate center fit for content
        val contentRect = calculateCenterFitRect(
            source.extent.size.width,
            source.extent.size.height,
            targetWidth,
            targetHeight
        )
        
        // Scale and position content
        val contentScaleX = contentRect.size.width / source.extent.size.width
        val contentScaleY = contentRect.size.height / source.extent.size.height
        val contentScale = minOf(contentScaleX, contentScaleY)
        
        val transform = CGAffineTransformConcat(
            CGAffineTransformMakeScale(contentScale, contentScale),
            CGAffineTransformMakeTranslation(contentRect.origin.x, contentRect.origin.y)
        )
        val scaledContent = source.imageByApplyingTransform(transform)
        
        // Composite
        val compositeFilter = CIFilter.filterWithName("CISourceOverCompositing")!!
        compositeFilter.setValue(scaledContent, forKey = "inputImage")
        compositeFilter.setValue(blackBg, forKey = "inputBackgroundImage")
        
        return compositeFilter.outputImage!!
    }
    
    private fun calculateCenterFitRect(
        srcWidth: Double,
        srcHeight: Double,
        dstWidth: Double,
        dstHeight: Double
    ): CGRect {
        val srcRatio = srcWidth / srcHeight
        val dstRatio = dstWidth / dstHeight
        
        val (scaledWidth, scaledHeight) = if (srcRatio > dstRatio) {
            // Source is wider, fit to width
            dstWidth to (dstWidth / srcRatio)
        } else {
            // Source is taller, fit to height
            (dstHeight * srcRatio) to dstHeight
        }
        
        val left = (dstWidth - scaledWidth) / 2.0
        val top = (dstHeight - scaledHeight) / 2.0
        
        return CGRectMake(left, top, scaledWidth, scaledHeight)
    }
}
