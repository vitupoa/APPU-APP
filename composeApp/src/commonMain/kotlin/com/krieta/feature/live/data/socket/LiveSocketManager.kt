package com.krieta.feature.live.data.socket

import com.krieta.com.core.util.currentTimeMillis
import io.ktor.client.*
import io.ktor.client.plugins.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString

@Serializable
data class SocketMessage(
    val event: String,
    val data: String
)

@Serializable
data class LiveMessageData(
    val id: String,
    val userId: String,
    val username: String,
    val avatarUrl: String?,
    val text: String,
    val isSystem: Boolean = false,
    val isPinned: Boolean = false,
    val timestamp: Long = currentTimeMillis()
)

@Serializable
data class ViewerUpdateData(
    val viewerCount: Int,
    val userId: String?,
    val username: String?,
    val action: String
)

@Serializable
data class TipData(
    val id: String,
    val senderId: String,
    val senderName: String,
    val senderAvatar: String?,
    val recipientId: String,
    val amountKr: Double,
    val message: String?,
    val giftType: String?
)

@Serializable
data class LikeData(
    val userId: String,
    val username: String,
    val count: Int = 1
)

sealed class LiveSocketEvent {
    data class Connected(val streamId: String) : LiveSocketEvent()
    data class Disconnected(val reason: String) : LiveSocketEvent()
    data class Error(val message: String) : LiveSocketEvent()
    data class MessageReceived(val message: LiveMessageData) : LiveSocketEvent()
    data class ViewerUpdate(val data: ViewerUpdateData) : LiveSocketEvent()
    data class TipReceived(val tip: TipData) : LiveSocketEvent()
    data class LikeReceived(val like: LikeData) : LiveSocketEvent()
    data class StreamEnded(val streamId: String) : LiveSocketEvent()
}

class LiveSocketManager(
    private val client: HttpClient,
    private val baseUrl: String
) {
    private var webSocketSession: DefaultClientWebSocketSession? = null
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val json = Json { ignoreUnknownKeys = true }
    
    private val _events = MutableSharedFlow<LiveSocketEvent>(replay = 0)
    val events: SharedFlow<LiveSocketEvent> = _events.asSharedFlow()
    
    private var currentStreamId: String? = null
    private var isConnected = false
    
    suspend fun connect(streamId: String, authToken: String) {
        if (isConnected && currentStreamId == streamId) return
        
        disconnect()
        currentStreamId = streamId
        
        try {
            webSocketSession = client.webSocketSession(
                urlString = "$baseUrl/live?streamId=$streamId&token=$authToken"
            )
            
            isConnected = true
            _events.emit(LiveSocketEvent.Connected(streamId))
            
            scope.launch {
                listenForMessages()
            }
            
            sendEvent("viewer:join", mapOf("streamId" to streamId))
            
        } catch (e: Exception) {
            isConnected = false
            _events.emit(LiveSocketEvent.Error(e.message ?: "Connection failed"))
        }
    }
    
    private suspend fun listenForMessages() {
        try {
            webSocketSession?.incoming?.let { incoming ->
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        handleMessage(frame.readText())
                    }
                }
            }
        } catch (e: Exception) {
            isConnected = false
            _events.emit(LiveSocketEvent.Disconnected(e.message ?: "Connection lost"))
        }
    }
    
    private suspend fun handleMessage(text: String) {
        try {
            val socketMessage = json.decodeFromString<SocketMessage>(text)
            
            when (socketMessage.event) {
                "message" -> {
                    val messageData = json.decodeFromString<LiveMessageData>(socketMessage.data)
                    _events.emit(LiveSocketEvent.MessageReceived(messageData))
                }
                "viewer:joined", "viewer:left" -> {
                    val viewerData = json.decodeFromString<ViewerUpdateData>(socketMessage.data)
                    _events.emit(LiveSocketEvent.ViewerUpdate(viewerData))
                }
                "tip:received" -> {
                    val tipData = json.decodeFromString<TipData>(socketMessage.data)
                    _events.emit(LiveSocketEvent.TipReceived(tipData))
                }
                "like:received" -> {
                    val likeData = json.decodeFromString<LikeData>(socketMessage.data)
                    _events.emit(LiveSocketEvent.LikeReceived(likeData))
                }
                "stream:ended" -> {
                    currentStreamId?.let {
                        _events.emit(LiveSocketEvent.StreamEnded(it))
                    }
                }
            }
        } catch (e: Exception) {
            // Ignore parse errors
        }
    }
    
    suspend fun sendMessage(text: String, userId: String, username: String, avatarUrl: String?) {
        val messageData = LiveMessageData(
            id = "temp_${currentTimeMillis()}",
            userId = userId,
            username = username,
            avatarUrl = avatarUrl,
            text = text
        )
        sendEvent("message:send", messageData)
    }
    
    suspend fun sendLike(userId: String, username: String) {
        sendEvent("like:send", LikeData(userId, username, 1))
    }
    
    suspend fun sendTip(
        senderId: String,
        senderName: String,
        senderAvatar: String?,
        recipientId: String,
        amountKr: Double,
        message: String?,
        giftType: String?
    ) {
        val tipData = TipData(
            "tip_${currentTimeMillis()}",
            senderId,
            senderName,
            senderAvatar,
            recipientId,
            amountKr,
            message,
            giftType
        )
        sendEvent("tip:send", tipData)
    }
    
    private suspend fun sendEvent(event: String, data: Any) {
        try {
            val jsonData = json.encodeToString(data)
            val socketMessage = SocketMessage(event, jsonData)
            val messageText = json.encodeToString(socketMessage)
            webSocketSession?.send(Frame.Text(messageText))
        } catch (e: Exception) {
            _events.emit(LiveSocketEvent.Error("Failed to send message"))
        }
    }
    
    suspend fun disconnect() {
        if (!isConnected) return
        
        try {
            currentStreamId?.let { streamId ->
                sendEvent("viewer:leave", mapOf("streamId" to streamId))
            }
            webSocketSession?.close()
            webSocketSession = null
            isConnected = false
            currentStreamId = null
        } catch (e: Exception) {
            // Ignore disconnect errors
        }
    }
}
