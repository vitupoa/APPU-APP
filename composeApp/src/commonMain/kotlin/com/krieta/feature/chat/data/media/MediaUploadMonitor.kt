package com.krieta.feature.chat.data.media

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.krieta.com.core.util.currentTimeMillis
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

data class UploadMetrics(
    val totalUploads: Int = 0,
    val successfulUploads: Int = 0,
    val failedUploads: Int = 0,
    val totalBytesUploaded: Long = 0,
    val averageUploadTime: Long = 0,
    val lastUploadTime: Instant? = null,
    val uploadsByType: Map<String, Int> = emptyMap(),
    val errorsByType: Map<String, Int> = emptyMap()
)

data class UploadEvent(
    val timestamp: Instant,
    val chatId: String,
    val mediaType: String,
    val fileSize: Long,
    val success: Boolean,
    val durationMs: Long,
    val errorMessage: String? = null
)

class MediaUploadMonitor {
    private val _metrics = MutableStateFlow(UploadMetrics())
    val metrics: StateFlow<UploadMetrics> = _metrics.asStateFlow()
    
    private val _recentEvents = MutableStateFlow<List<UploadEvent>>(emptyList())
    val recentEvents: StateFlow<List<UploadEvent>> = _recentEvents.asStateFlow()
    
    private val uploadStartTimes = mutableMapOf<String, Instant>()
    
    fun startUpload(uploadId: String) {
        uploadStartTimes[uploadId] = Clock.System.now()
    }
    
    fun recordSuccess(
        uploadId: String,
        chatId: String,
        mediaType: String,
        fileSize: Long
    ) {
        val startTime = uploadStartTimes.remove(uploadId) ?: Clock.System.now()
        val duration = Clock.System.now().toEpochMilliseconds() - startTime.toEpochMilliseconds()
        
        val event = UploadEvent(
            timestamp = Clock.System.now(),
            chatId = chatId,
            mediaType = mediaType,
            fileSize = fileSize,
            success = true,
            durationMs = duration
        )
        
        addEvent(event)
        updateMetrics(event)
    }
    
    fun recordFailure(
        uploadId: String,
        chatId: String,
        mediaType: String,
        fileSize: Long,
        errorMessage: String
    ) {
        val startTime = uploadStartTimes.remove(uploadId) ?: Clock.System.now()
        val duration = Clock.System.now().toEpochMilliseconds() - startTime.toEpochMilliseconds()
        
        val event = UploadEvent(
            timestamp = Clock.System.now(),
            chatId = chatId,
            mediaType = mediaType,
            fileSize = fileSize,
            success = false,
            durationMs = duration,
            errorMessage = errorMessage
        )
        
        addEvent(event)
        updateMetrics(event)
    }
    
    private fun addEvent(event: UploadEvent) {
        val current = _recentEvents.value.toMutableList()
        current.add(0, event)
        if (current.size > 100) {
            current.removeAt(current.size - 1)
        }
        _recentEvents.value = current
    }
    
    private fun updateMetrics(event: UploadEvent) {
        val current = _metrics.value
        
        val totalUploads = current.totalUploads + 1
        val successfulUploads = if (event.success) current.successfulUploads + 1 else current.successfulUploads
        val failedUploads = if (!event.success) current.failedUploads + 1 else current.failedUploads
        val totalBytes = if (event.success) current.totalBytesUploaded + event.fileSize else current.totalBytesUploaded
        
        val allEvents = _recentEvents.value.filter { it.success }
        val avgTime = if (allEvents.isNotEmpty()) {
            allEvents.map { it.durationMs }.average().toLong()
        } else {
            0L
        }
        
        val uploadsByType = current.uploadsByType.toMutableMap()
        uploadsByType[event.mediaType] = (uploadsByType[event.mediaType] ?: 0) + 1
        
        val errorsByType = current.errorsByType.toMutableMap()
        if (!event.success && event.errorMessage != null) {
            errorsByType[event.errorMessage] = (errorsByType[event.errorMessage] ?: 0) + 1
        }
        
        _metrics.value = UploadMetrics(
            totalUploads = totalUploads,
            successfulUploads = successfulUploads,
            failedUploads = failedUploads,
            totalBytesUploaded = totalBytes,
            averageUploadTime = avgTime,
            lastUploadTime = event.timestamp,
            uploadsByType = uploadsByType,
            errorsByType = errorsByType
        )
    }
    
    fun getSuccessRate(): Float {
        val total = _metrics.value.totalUploads
        return if (total > 0) {
            _metrics.value.successfulUploads.toFloat() / total.toFloat()
        } else {
            0f
        }
    }
    
    fun getRecentFailures(count: Int = 10): List<UploadEvent> {
        return _recentEvents.value.filter { !it.success }.take(count)
    }
    
    fun clearMetrics() {
        _metrics.value = UploadMetrics()
        _recentEvents.value = emptyList()
        uploadStartTimes.clear()
    }
}
