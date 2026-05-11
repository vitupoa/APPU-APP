package com.krieta.com.core.offline

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import platform.Foundation.*
import platform.darwin.NSObject

actual class MediaCacheManager : BaseMediaCacheManager() {
    
    private val cacheDir: String by lazy {
        val paths = NSSearchPathForDirectoriesInDomains(
            NSCachesDirectory,
            NSUserDomainMask,
            true
        )
        val cachePath = paths.first() as String
        "$cachePath/media_cache"
    }
    
    init {
        // Create cache directory if it doesn't exist
        val fileManager = NSFileManager.defaultManager
        if (!fileManager.fileExistsAtPath(cacheDir)) {
            fileManager.createDirectoryAtPath(
                cacheDir,
                withIntermediateDirectories = true,
                attributes = null,
                error = null
            )
        }
    }
    
    actual suspend fun cacheMedia(url: String, mediaType: MediaType): String? = withContext(Dispatchers.IO) {
        try {
            if (cacheMap.containsKey(url)) {
                return@withContext cacheMap[url]
            }
            
            val extension = getFileExtension(url)
            val fileName = generateCacheFileName(url, extension)
            val cachePath = "$cacheDir/$fileName"
            
            // Download and save file
            val nsUrl = NSURL(string = url)
            val data = NSData.dataWithContentsOfURL(nsUrl) ?: return@withContext null
            
            data.writeToFile(cachePath, atomically = true)
            
            cacheMap[url] = cachePath
            
            println("✅ Cached media: $url -> $cachePath")
            cachePath
        } catch (e: Exception) {
            println("❌ Failed to cache media $url: ${e.message}")
            null
        }
    }
    
    actual suspend fun getCachedMediaPath(url: String): String? = withContext(Dispatchers.IO) {
        cacheMap[url]
    }
    
    actual suspend fun clearCache() = withContext(Dispatchers.IO) {
        val fileManager = NSFileManager.defaultManager
        val contents = fileManager.contentsOfDirectoryAtPath(cacheDir, error = null) as? List<*>
        contents?.forEach { fileName ->
            val filePath = "$cacheDir/$fileName"
            fileManager.removeItemAtPath(filePath, error = null)
        }
        cacheMap.clear()
    }
    
    actual suspend fun getCacheSize(): Long = withContext(Dispatchers.IO) {
        val fileManager = NSFileManager.defaultManager
        val contents = fileManager.contentsOfDirectoryAtPath(cacheDir, error = null) as? List<*>
        var totalSize = 0L
        
        contents?.forEach { fileName ->
            val filePath = "$cacheDir/$fileName"
            val attributes = fileManager.attributesOfItemAtPath(filePath, error = null)
            val fileSize = (attributes?.get(NSFileSize) as? NSNumber)?.longValue ?: 0L
            totalSize += fileSize
        }
        
        totalSize
    }
}
