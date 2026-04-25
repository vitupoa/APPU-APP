package com.krieta.feature.chat.data.local

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import platform.Network.*
import platform.darwin.dispatch_queue_create

actual class OfflineMessageSyncService(
    private val database: LocalMessageDatabase,
    private val onSyncMessage: suspend (LocalMessageEntity) -> Result<Unit>
) {
    private val _isOnline = MutableStateFlow(false)
    actual val isOnline: StateFlow<Boolean> = _isOnline

    private val scope = CoroutineScope(Dispatchers.Default)
    private val monitor = nw_path_monitor_create()
    private val queue = dispatch_queue_create("com.krieta.network.monitor", null)

    init {
        nw_path_monitor_set_update_handler(monitor) { path ->
            val status = nw_path_get_status(path)
            _isOnline.value = status == nw_path_status_satisfied
            
            if (_isOnline.value) {
                syncPendingMessages()
            }
        }
        
        nw_path_monitor_set_queue(monitor, queue)
        nw_path_monitor_start(monitor)
    }

    actual fun syncPendingMessages() {
        scope.launch {
            if (!_isOnline.value) return@launch

            val unsyncedMessages = database.getUnsyncedMessages()
            
            unsyncedMessages.forEach { message ->
                if (message.retryCount >= 5) {
                    database.updateMessageStatus(message.id, "failed")
                    return@forEach
                }

                try {
                    val result = onSyncMessage(message)
                    if (result.isSuccess) {
                        database.markAsSynced(message.id)
                    } else {
                        database.updateMessageStatus(message.id, "pending")
                    }
                } catch (e: Exception) {
                    database.updateMessageStatus(message.id, "pending")
                }
            }
        }
    }

    actual suspend fun queueMessage(message: LocalMessageEntity) {
        database.insertMessage(message)
        if (_isOnline.value) {
            syncPendingMessages()
        }
    }

    actual fun cleanup() {
        nw_path_monitor_cancel(monitor)
    }
}
