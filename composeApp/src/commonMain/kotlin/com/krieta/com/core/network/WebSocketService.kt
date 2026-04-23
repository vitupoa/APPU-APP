package com.krieta.com.core.network

import com.krieta.com.core.security.TokenManager
import io.ktor.client.HttpClient
import io.ktor.client.plugins.websocket.webSocketSession
import io.ktor.websocket.Frame
import io.ktor.websocket.WebSocketSession
import io.ktor.websocket.close
import io.ktor.websocket.readText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

enum class WebSocketConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    RECONNECTING,
    ERROR
}

/**
 * Global WebSocket Service orchestrating single-connection push events
 * natively across iOS and Android encapsulating auto-reconnect backoff logic.
 * 
 * Enhanced with:
 * - Connection state monitoring
 * - Heartbeat/ping-pong validation
 * - Better error handling and logging
 * - Connection quality metrics
 */
class WebSocketService(
    private val httpClient: HttpClient,
    private val tokenManager: TokenManager
) {
    private var session: WebSocketSession? = null
    private var connectionJob: Job? = null
    private var heartbeatJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default)

    // Connection state tracking
    private val _connectionState = MutableStateFlow(WebSocketConnectionState.DISCONNECTED)
    val connectionState: StateFlow<WebSocketConnectionState> = _connectionState
    
    private var reconnectAttempts = 0
    private var lastSuccessfulConnection: Long = 0
    private var lastMessageReceived: Long = 0

    /**
     * Payload flow representing dynamic Backend generic payloads implicitly mapped.
     */
    private val _notificationsFlow = MutableSharedFlow<String>(replay = 0)
    val notificationsFlow: SharedFlow<String> = _notificationsFlow

    private val _milestonesFlow = MutableSharedFlow<String>(replay = 0)
    val milestonesFlow: SharedFlow<String> = _milestonesFlow

    private val _walletFlow = MutableSharedFlow<String>(replay = 0)
    val walletFlow: SharedFlow<String> = _walletFlow

    private val _voteUpdateFlow = MutableSharedFlow<String>(replay = 0)
    val voteUpdateFlow: SharedFlow<String> = _voteUpdateFlow

    private val _contestUpdateFlow = MutableSharedFlow<String>(replay = 0)
    val contestUpdateFlow: SharedFlow<String> = _contestUpdateFlow
    
    private val _likeUpdateFlow = MutableSharedFlow<String>(replay = 0)
    val likeUpdateFlow: SharedFlow<String> = _likeUpdateFlow

    // Chat Flows
    private val _chatNewMessageFlow = MutableSharedFlow<String>(replay = 0)
    val chatNewMessageFlow: SharedFlow<String> = _chatNewMessageFlow

    private val _chatNewChatFlow = MutableSharedFlow<String>(replay = 0)
    val chatNewChatFlow: SharedFlow<String> = _chatNewChatFlow

    private val _chatTypingFlow = MutableSharedFlow<String>(replay = 0)
    val chatTypingFlow: SharedFlow<String> = _chatTypingFlow

    private val _chatReadReceiptFlow = MutableSharedFlow<String>(replay = 0)
    val chatReadReceiptFlow: SharedFlow<String> = _chatReadReceiptFlow

    /**
     * Connects to the Redis-backed Socket.io equivalent Ktor Gateway.
     */
    fun connect() {
        if (connectionJob?.isActive == true) {
            println("[WebSocket] Already connected or connecting")
            return
        }

        connectionJob = scope.launch {
            var retryDelay = 1000L
            val maxDelay = 30000L
            val maxReconnectAttempts = 10

            while (isActive) {
                try {
                    _connectionState.value = if (reconnectAttempts == 0) 
                        WebSocketConnectionState.CONNECTING 
                    else 
                        WebSocketConnectionState.RECONNECTING
                    
                    val token = tokenManager.getAccessToken()
                    if (token == null) {
                        println("[WebSocket] No access token available, waiting...")
                        _connectionState.value = WebSocketConnectionState.ERROR
                        delay(5000L)
                        continue
                    }
                    
                    // Natively construct the WebSockets URI routing over WebSocket schema (ws:// or wss://)
                    val host = ApiConstants.BASE_URL
                        .replace("http://", "ws://")
                        .replace("https://", "wss://")
                    
                    val wsUrl = "$host/socket.io/?EIO=4&transport=websocket"
                    println("[WebSocket] Connecting to: $wsUrl (attempt ${reconnectAttempts + 1})")
                    
                    session = httpClient.webSocketSession(wsUrl)
                    
                    // Authenticate explicitly over the established persistent bridge
                    val authMessage = "42[\"authenticate\", {\"token\": \"$token\"}]"
                    session?.send(Frame.Text(authMessage))
                    println("[WebSocket] Authentication message sent")
                    
                    _connectionState.value = WebSocketConnectionState.CONNECTED
                    lastSuccessfulConnection = System.currentTimeMillis()
                    reconnectAttempts = 0
                    retryDelay = 1000L // Reset backoff on successful connection
                    
                    // Start heartbeat monitoring
                    startHeartbeat()

                    // Listen indefinitely natively
                    for (frame in session?.incoming!!) {
                        if (frame is Frame.Text) {
                            val text = frame.readText()
                            lastMessageReceived = System.currentTimeMillis()
                            handleIncomingPayload(text)
                        }
                    }
                } catch (e: Exception) {
                    reconnectAttempts++
                    _connectionState.value = WebSocketConnectionState.ERROR
                    
                    println("[WebSocket] Connection error (attempt $reconnectAttempts): ${e.message}")
                    e.printStackTrace()
                    
                    if (reconnectAttempts >= maxReconnectAttempts) {
                        println("[WebSocket] Max reconnection attempts reached. Stopping.")
                        _connectionState.value = WebSocketConnectionState.DISCONNECTED
                        break
                    }
                } finally {
                    heartbeatJob?.cancel()
                    session?.close()
                    session = null
                }

                // Exponential backoff with jitter
                val jitter = (0..1000).random()
                val actualDelay = retryDelay + jitter
                println("[WebSocket] Reconnecting in ${actualDelay}ms...")
                delay(actualDelay)
                retryDelay = (retryDelay * 2).coerceAtMost(maxDelay)
            }
        }
    }
    
    /**
     * Start heartbeat monitoring to detect stale connections
     */
    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (isActive && session != null) {
                delay(30000L) // Check every 30 seconds
                
                val timeSinceLastMessage = System.currentTimeMillis() - lastMessageReceived
                if (timeSinceLastMessage > 60000L) { // 60 seconds timeout
                    println("[WebSocket] No messages received for 60s, connection may be stale")
                    // Force reconnection
                    session?.close()
                    break
                }
                
                // Send ping if supported
                try {
                    session?.send(Frame.Text("2")) // Socket.io ping
                } catch (e: Exception) {
                    println("[WebSocket] Heartbeat failed: ${e.message}")
                }
            }
        }
    }

    private suspend fun handleIncomingPayload(payload: String) {
        // Socket.io sends message envelopes formatted like 42["event_name", {data}]
        // Also handle pong responses ("3")
        try {
            when {
                payload == "3" -> {
                    // Pong response
                    println("[WebSocket] Received pong")
                    return
                }
                payload.startsWith("42") -> {
                    val jsonPayload = payload.substring(2) // Strip "42" prefixes
                    val array = Json.parseToJsonElement(jsonPayload).jsonArray
                    
                    if (array.size < 2) {
                        println("[WebSocket] Invalid payload format: $payload")
                        return
                    }
                    
                    val eventName = array[0].jsonPrimitive.content
                    val dataContent = array[1].toString()

                    println("[WebSocket] Received event: $eventName")

                    when (eventName) {
                        "notification_received" -> _notificationsFlow.emit(dataContent)
                        "milestone_completed" -> _milestonesFlow.emit(dataContent)
                        "wallet_updated" -> _walletFlow.emit(dataContent)
                        "vote_update" -> _voteUpdateFlow.emit(dataContent)
                        "contest_update" -> _contestUpdateFlow.emit(dataContent)
                        "like_update" -> _likeUpdateFlow.emit(dataContent)
                        "chat:new_message" -> _chatNewMessageFlow.emit(dataContent)
                        "chat:new_chat" -> _chatNewChatFlow.emit(dataContent)
                        "chat:typing" -> _chatTypingFlow.emit(dataContent)
                        "chat:read_receipt" -> _chatReadReceiptFlow.emit(dataContent)
                        "authenticated" -> println("[WebSocket] Authentication successful")
                        else -> println("[WebSocket] Unknown event: $eventName")
                    }
                }
                payload.startsWith("0") -> {
                    println("[WebSocket] Connection established (Socket.io handshake)")
                }
                else -> {
                    println("[WebSocket] Unhandled payload: $payload")
                }
            }
        } catch (e: Exception) {
            println("[WebSocket] Error parsing payload: ${e.message}")
            println("[WebSocket] Payload was: $payload")
        }
    }
    
    /**
     * Get connection quality metrics
     */
    fun getConnectionMetrics(): Map<String, Any> {
        return mapOf(
            "state" to _connectionState.value.name,
            "reconnectAttempts" to reconnectAttempts,
            "lastSuccessfulConnection" to lastSuccessfulConnection,
            "lastMessageReceived" to lastMessageReceived,
            "timeSinceLastMessage" to (System.currentTimeMillis() - lastMessageReceived),
            "isConnected" to (_connectionState.value == WebSocketConnectionState.CONNECTED)
        )
    }

    fun disconnect() {
        println("[WebSocket] Disconnecting...")
        connectionJob?.cancel()
        heartbeatJob?.cancel()
        scope.launch {
            session?.close()
            session = null
            _connectionState.value = WebSocketConnectionState.DISCONNECTED
        }
    }
    
    /**
     * Force reconnection (useful for testing or after network changes)
     */
    fun reconnect() {
        println("[WebSocket] Force reconnecting...")
        disconnect()
        reconnectAttempts = 0
        connect()
    }
}
