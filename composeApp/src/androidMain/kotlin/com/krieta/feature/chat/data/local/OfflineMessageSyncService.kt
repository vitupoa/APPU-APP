package com.krieta.feature.chat.data.local

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class OfflineMessageSyncService(
    private val context: Context,
    private val localMessageDao: LocalMessageDao,
    private val onSyncMessage: suspend (LocalMessageEntity) -> Result<Unit>
) {
    private val _isOnline = MutableStateFlow(false)
    val isOnline: StateFlow<Boolean> = _isOnline

    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private val scope = CoroutineScope(Dispatchers.IO)

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            _isOnline.value = true
            syncPendingMessages()
        }

        override fun onLost(network: Network) {
            _isOnline.value = false
        }
    }

    init {
        // Check initial connectivity
        _isOnline.value = isNetworkAvailable()

        // Register network callback
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(networkRequest, networkCallback)
    }

    private fun isNetworkAvailable(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun syncPendingMessages() {
        scope.launch {
            if (!_isOnline.value) return@launch

            val unsyncedMessages = localMessageDao.getUnsyncedMessages()
            
            unsyncedMessages.forEach { message ->
                // Skip if too many retries
                if (message.retryCount >= 5) {
                    localMessageDao.updateMessageStatus(message.id, "failed")
                    return@forEach
                }

                try {
                    val result = onSyncMessage(message)
                    if (result.isSuccess) {
                        localMessageDao.markAsSynced(message.id)
                    } else {
                        localMessageDao.updateMessageStatus(message.id, "pending")
                    }
                } catch (e: Exception) {
                    localMessageDao.updateMessageStatus(message.id, "pending")
                }
            }
        }
    }

    suspend fun queueMessage(message: LocalMessageEntity) {
        localMessageDao.insertMessage(message)
        if (_isOnline.value) {
            syncPendingMessages()
        }
    }

    fun cleanup() {
        connectivityManager.unregisterNetworkCallback(networkCallback)
    }
}
