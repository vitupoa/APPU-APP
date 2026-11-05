package com.runinga.com.core.memory

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class BoundedList<T>(private val maxSize: Int = 100) {
    private val _items = MutableStateFlow<List<T>>(emptyList())
    val items: StateFlow<List<T>> = _items.asStateFlow()
    
    fun add(item: T) {
        val current = _items.value.toMutableList()
        current.add(0, item)
        
        if (current.size > maxSize) {
            current.removeAt(current.lastIndex)
        }
        
        _items.value = current
    }
    
    fun addAll(items: List<T>) {
        val current = _items.value.toMutableList()
        current.addAll(0, items)
        
        if (current.size > maxSize) {
            _items.value = current.take(maxSize)
        } else {
            _items.value = current
        }
    }
    
    fun remove(predicate: (T) -> Boolean) {
        _items.value = _items.value.filterNot(predicate)
    }
    
    fun clear() {
        _items.value = emptyList()
    }
    
    fun size(): Int = _items.value.size
}

object MemoryManager {
    private var lastGcTime = System.currentTimeMillis()
    private const val GC_INTERVAL = 60_000L
    
    fun requestGcIfNeeded() {
        val now = System.currentTimeMillis()
        if (now - lastGcTime > GC_INTERVAL) {
            System.gc()
            lastGcTime = now
        }
    }
    
    fun getMemoryUsage(): MemoryInfo {
        val runtime = Runtime.getRuntime()
        val totalMemory = runtime.totalMemory()
        val freeMemory = runtime.freeMemory()
        val usedMemory = totalMemory - freeMemory
        val maxMemory = runtime.maxMemory()
        
        return MemoryInfo(
            usedMb = usedMemory / 1024 / 1024,
            totalMb = totalMemory / 1024 / 1024,
            maxMb = maxMemory / 1024 / 1024,
            usagePercent = (usedMemory.toFloat() / maxMemory * 100).toInt()
        )
    }
}

data class MemoryInfo(
    val usedMb: Long,
    val totalMb: Long,
    val maxMb: Long,
    val usagePercent: Int
)
