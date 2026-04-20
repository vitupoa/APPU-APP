package com.krieta.com.core.video

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class VideoCacheManager {
    private val cache = mutableMapOf<String, CacheEntry>()
    private val mutex = Mutex()
    private val scope = CoroutineScope(Dispatchers.Default)
    private val preloadJobs = mutableMapOf<String, Job>()
    
    private val maxCacheSize = 10
    private val preloadDistance = 2
    
    data class CacheEntry(
        val url: String,
        val lastAccessed: Long = System.currentTimeMillis(),
        val isPreloaded: Boolean = false
    )
    
    suspend fun preloadVideos(currentIndex: Int, videoUrls: List<String>) {
        mutex.withLock {
            preloadJobs.values.forEach { it.cancel() }
            preloadJobs.clear()
            
            for (i in 1..preloadDistance) {
                val nextIndex = currentIndex + i
                if (nextIndex < videoUrls.size) {
                    val url = videoUrls[nextIndex]
                    if (!cache.containsKey(url)) {
                        preloadVideo(url)
                    }
                }
            }
            
            val prevIndex = currentIndex - 1
            if (prevIndex >= 0) {
                val url = videoUrls[prevIndex]
                if (!cache.containsKey(url)) {
                    preloadVideo(url)
                }
            }
            
            cleanCache()
        }
    }
    
    private fun preloadVideo(url: String) {
        val job = scope.launch {
            try {
                mutex.withLock {
                    cache[url] = CacheEntry(url, isPreloaded = true)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        preloadJobs[url] = job
    }
    
    suspend fun markAccessed(url: String) {
        mutex.withLock {
            cache[url] = CacheEntry(url, lastAccessed = System.currentTimeMillis(), isPreloaded = true)
        }
    }
    
    suspend fun isCached(url: String): Boolean {
        return mutex.withLock {
            cache.containsKey(url)
        }
    }
    
    private suspend fun cleanCache() {
        if (cache.size > maxCacheSize) {
            val sortedEntries = cache.entries.sortedBy { it.value.lastAccessed }
            val toRemove = sortedEntries.take(cache.size - maxCacheSize)
            toRemove.forEach { cache.remove(it.key) }
        }
    }
    
    suspend fun clearCache() {
        mutex.withLock {
            preloadJobs.values.forEach { it.cancel() }
            preloadJobs.clear()
            cache.clear()
        }
    }
}
