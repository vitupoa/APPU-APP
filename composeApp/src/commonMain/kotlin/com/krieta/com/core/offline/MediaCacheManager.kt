package com.krieta.com.core.offline

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

expect class MediaCacheManager {
    suspend fun cacheMedia(url: String, mediaType: MediaType): String?
    suspend fun getCachedMediaPath(url: String): String?
    suspend fun isCached(url: String): Boolean
    suspend fun clearCache()
    suspend fun getCacheSize(): Long
}

enum class MediaType {
    IMAGE, VIDEO, AUDIO
}

// Common implementation
@OptIn(ExperimentalUuidApi::class)
abstract class BaseMediaCacheManager {
    protected val cacheMap = mutableMapOf<String, String>()
    
    protected fun generateCacheFileName(url: String, extension: String): String {
        return "${Uuid.random()}.$extension"
    }
    
    protected fun getFileExtension(url: String): String {
        return url.substringAfterLast('.', "jpg")
    }
    
    suspend fun isCached(url: String): Boolean = withContext(Dispatchers.IO) {
        cacheMap.containsKey(url)
    }
}
