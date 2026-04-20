package com.krieta.com.core.performance

import androidx.compose.runtime.*
import kotlinx.coroutines.delay

class PerformanceMonitor {
    private val frameTimeHistory = mutableListOf<Long>()
    private val maxHistorySize = 60
    
    var averageFps by mutableStateOf(60f)
        private set
    
    var isLagging by mutableStateOf(false)
        private set
    
    fun recordFrame(frameTimeNanos: Long) {
        frameTimeHistory.add(frameTimeNanos)
        
        if (frameTimeHistory.size > maxHistorySize) {
            frameTimeHistory.removeAt(0)
        }
        
        if (frameTimeHistory.size >= 10) {
            val avgFrameTime = frameTimeHistory.takeLast(10).average()
            averageFps = (1_000_000_000 / avgFrameTime).toFloat()
            isLagging = averageFps < 30f
        }
    }
    
    fun reset() {
        frameTimeHistory.clear()
        averageFps = 60f
        isLagging = false
    }
}

@Composable
fun rememberPerformanceMonitor(): PerformanceMonitor {
    val monitor = remember { PerformanceMonitor() }
    
    LaunchedEffect(Unit) {
        while (true) {
            val startTime = System.nanoTime()
            delay(16)
            val frameTime = System.nanoTime() - startTime
            monitor.recordFrame(frameTime)
        }
    }
    
    return monitor
}
