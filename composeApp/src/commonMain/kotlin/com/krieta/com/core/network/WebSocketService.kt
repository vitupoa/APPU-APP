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
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Global WebSocket Service orchestrating single-connection push events
 * natively across iOS and Android encapsulating auto-reconnect backoff logic.
 */
class WebSocketService(
    private val httpClient: HttpClient,
    private val tokenManager: TokenManager
) {
    private var session: WebSocketSession? = null
    private var connectionJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default)

    /**
     * Payload flow representing dynamic Backend generic payloads implicitly mapped.
     */
    private val _notificationsFlow = MutableSharedFlow<String>()
    val notificationsFlow: SharedFlow<String> = _notificationsFlow

    private val _milestonesFlow = MutableSharedFlow<String>()
    val milestonesFlow: SharedFlow<String> = _milestonesFlow

    private val _walletFlow = MutableSharedFlow<String>()
    val walletFlow: SharedFlow<String> = _walletFlow

    /**
     * Connects to the Redis-backed Socket.io equivalent Ktor Gateway.
     */
    fun connect() {
        if (connectionJob?.isActive == true) return

        connectionJob = scope.launch {
            var retryDelay = 1000L
            val maxDelay = 30000L

            while (isActive) {
                try {
                    val token = tokenManager.getAccessToken() ?: throw Exception("Unauthorized Socket Binding")
                    
                    // Natively construct the WebSockets URI routing over WebSocket schema (ws:// or wss://)
                    val host = ApiConstants.BASE_URL.replace("http://", "ws://").replace("https://", "wss://")
                    
                    session = httpClient.webSocketSession("$host/socket.io/?EIO=4&transport=websocket")
                    
                    // Authenticate explicitly over the established persistent bridge mapping the backend configuration natively
                    session?.send(Frame.Text("42[\"authenticate\", {\"token\": \"$token\"}]"))
                    
                    retryDelay = 1000L // Reset backoff on successful connection

                    // Listen indefinitely natively
                    for (frame in session?.incoming!!) {
                        if (frame is Frame.Text) {
                            val text = frame.readText()
                            handleIncomingPayload(text)
                        }
                    }
                } catch (e: Exception) {
                    println("WebSocket Reconnecting due to: ${e.message}")
                } finally {
                    session?.close()
                    session = null
                }

                // Exponential backoff
                delay(retryDelay)
                retryDelay = (retryDelay * 2).coerceAtMost(maxDelay)
            }
        }
    }

    private suspend fun handleIncomingPayload(payload: String) {
        // Socket.io sends message envelopes formatted like 42["event_name", {data}]
        // This parser extracts the native event strings natively handling Express formats
        if (payload.startsWith("42")) {
            try {
                val jsonPayload = payload.substring(2) // Strip "42" prefixes implicitly
                val array = Json.parseToJsonElement(jsonPayload).kotlinx.serialization.json.jsonArray
                val eventName = array[0].jsonPrimitive.content
                val dataContent = array[1].toString()

                when (eventName) {
                    "notification_received" -> _notificationsFlow.emit(dataContent)
                    "milestone_completed" -> _milestonesFlow.emit(dataContent)
                    "wallet_updated" -> _walletFlow.emit(dataContent)
                }
            } catch (e: Exception) {
                // Ignore parsing constraints organically
            }
        }
    }

    fun disconnect() {
        connectionJob?.cancel()
        scope.launch {
            session?.close()
        }
    }
}
