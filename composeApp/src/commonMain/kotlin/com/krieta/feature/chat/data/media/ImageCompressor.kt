package com.krieta.feature.chat.data.media

expect class ImageCompressor() {
    suspend fun compress(
        imageBytes: ByteArray,
        mimeType: String,
        onProgress: (Float) -> Unit = {}
    ): ByteArray
    
    suspend fun compressToMaxSize(
        imageBytes: ByteArray,
        maxSizeBytes: Long,
        mimeType: String
    ): ByteArray
}
