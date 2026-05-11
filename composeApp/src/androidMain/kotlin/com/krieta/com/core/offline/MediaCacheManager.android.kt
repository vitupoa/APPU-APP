package com.krieta.com.core.offline

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL

actual class MediaCacheManager(private val context: Context) : BaseMediaCacheManager() {
    
    private val cacheDir: File by lazy {
        File(context.cacheDir, "media_cache").apply {
            if (!exists()) mkdirs()
        }
    }
    
    actual suspend fun cacheMedia(url: String, mediaType: MediaType): String? = withContext(Dispatchers.IO) {
        try {
            if (cacheMap.containsKey(url)) {
                return@withContext cacheMap[url]
            }
            
            val extension = getFileExtension(url)
            val fileName = generateCacheFileName(url, extension)
            val cacheFile = File(cacheDir, fileName)
            
            // Download and save file
            URL(url).openStream().use { input ->
                FileOutputStream(cacheFile).use { output ->
                    input.copyTo(output)
                }
            }
            
            val cachedPath = cacheFile.absolutePath
            cacheMap[url] = cachedPath
            
            println("✅ Cached media: $url -> $cachedPath")
            cachedPath
        } catch (e: Exception) {
            println("❌ Failed to cache media $url: ${e.message}")
            null
        }
    }
    
    actual suspend fun getCachedMediaPath(url: String): String? = withContext(Dispatchers.IO) {
        cacheMap[url]
    }
    
    actual suspend fun clearCache() = withContext(Dispatchers.IO) {
        cacheDir.listFiles()?.forEach { it.delete() }
        cacheMap.clear()
    }
    
    actual suspend fun getCacheSize(): Long = withContext(Dispatchers.IO) {
        cacheDir.walkTopDown().filter { it.isFile }.map { it.length() }.sum()
    }
}
