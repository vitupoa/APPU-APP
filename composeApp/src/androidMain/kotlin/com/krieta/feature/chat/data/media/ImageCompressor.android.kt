package com.krieta.feature.chat.data.media

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream

actual class ImageCompressor {
    actual suspend fun compress(
        imageBytes: ByteArray,
        mimeType: String,
        onProgress: (Float) -> Unit
    ): ByteArray {
        onProgress(0f)
        
        val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
        
        val maxDimension = 1920
        val scale = minOf(
            maxDimension.toFloat() / bitmap.width,
            maxDimension.toFloat() / bitmap.height,
            1f
        )
        
        val targetWidth = (bitmap.width * scale).toInt()
        val targetHeight = (bitmap.height * scale).toInt()
        
        onProgress(0.3f)
        
        val scaledBitmap = Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
        
        onProgress(0.6f)
        
        val outputStream = ByteArrayOutputStream()
        val format = when {
            mimeType.contains("png") -> Bitmap.CompressFormat.PNG
            else -> Bitmap.CompressFormat.JPEG
        }
        
        scaledBitmap.compress(format, 85, outputStream)
        
        onProgress(1f)
        
        bitmap.recycle()
        scaledBitmap.recycle()
        
        return outputStream.toByteArray()
    }
    
    actual suspend fun compressToMaxSize(
        imageBytes: ByteArray,
        maxSizeBytes: Long,
        mimeType: String
    ): ByteArray {
        var quality = 90
        var compressed = compress(imageBytes, mimeType)
        
        while (compressed.size > maxSizeBytes && quality > 10) {
            quality -= 10
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            val outputStream = ByteArrayOutputStream()
            val format = when {
                mimeType.contains("png") -> Bitmap.CompressFormat.PNG
                else -> Bitmap.CompressFormat.JPEG
            }
            bitmap.compress(format, quality, outputStream)
            compressed = outputStream.toByteArray()
            bitmap.recycle()
        }
        
        return compressed
    }
}
