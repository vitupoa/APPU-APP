package com.krieta.com.core.network

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class NetworkRequestCache {
    private val activeRequests = mutableMapOf<String, CompletableDeferred<Any>>()
    private val mutex = Mutex()
    
    suspend fun <T> getOrFetch(
        key: String,
        fetcher: suspend () -> T
    ): T {
        mutex.withLock {
            @Suppress("UNCHECKED_CAST")
            val existing = activeRequests[key] as? CompletableDeferred<T>
            if (existing != null && existing.isActive) {
                return existing.await()
            }
            
            val deferred = CompletableDeferred<Any>()
            activeRequests[key] = deferred
            
            return try {
                val result = fetcher()
                deferred.complete(result as Any)
                result
            } catch (e: Exception) {
                deferred.completeExceptionally(e)
                throw e
            } finally {
                mutex.withLock {
                    activeRequests.remove(key)
                }
            }
        }
    }
    
    fun clear() {
        activeRequests.clear()
    }
}
