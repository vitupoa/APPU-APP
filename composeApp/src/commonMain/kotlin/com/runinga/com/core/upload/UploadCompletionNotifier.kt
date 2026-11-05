package com.runinga.com.core.upload

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

data class UploadCompletionEvent(
    val type: UploadType,
    val contentId: String,
    val success: Boolean
)

object UploadCompletionNotifier {
    private val _uploadCompletions = MutableSharedFlow<UploadCompletionEvent>()
    val uploadCompletions: SharedFlow<UploadCompletionEvent> = _uploadCompletions.asSharedFlow()
    
    suspend fun notifyUploadComplete(type: UploadType, contentId: String, success: Boolean) {
        _uploadCompletions.emit(UploadCompletionEvent(type, contentId, success))
    }
}
