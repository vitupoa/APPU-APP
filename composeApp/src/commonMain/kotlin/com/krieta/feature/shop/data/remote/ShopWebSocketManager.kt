package com.krieta.feature.shop.data.remote

import com.krieta.feature.shop.domain.model.Product
import io.ktor.client.*
import io.ktor.client.plugins.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.serialization.json.Json
import kotlinx.serialization.Serializable
import co.touchlab.kermit.Logger

@Serializable
sealed class ShopSocketEvent {
    @Serializable
    data class ProductCreated(val product: Product) : ShopSocketEvent()
    
    @Serializable
    data class ProductUpdated(val product: Product) : ShopSocketEvent()
    
    @Serializable
    data class ProductDeleted(val productId: String) : ShopSocketEvent()
}

class ShopWebSocketManager(
    private val client: HttpClient,
    private val baseUrl: String
) {
    private val logger = Logger.withTag("ShopWebSocket")
    private val _events = MutableSharedFlow<ShopSocketEvent>()
    val events: SharedFlow<ShopSocketEvent> = _events.asSharedFlow()
    
    private var session: DefaultClientWebSocketSession? = null
    
    suspend fun connect() {
        try {
            val wsUrl = baseUrl.replace("http://", "ws://").replace("https://", "wss://")
            client.webSocket("$wsUrl/socket.io/?EIO=4&transport=websocket") {
                session = this
                
                // Send join event
                send(Frame.Text("42[\"shop:join\"]"))
                logger.d { "Connected to shop WebSocket" }
                
                // Listen for messages
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        handleMessage(frame.readText())
                    }
                }
            }
        } catch (e: Exception) {
            logger.e(e) { "WebSocket connection error" }
        }
    }
    
    private suspend fun handleMessage(message: String) {
        try {
            // Socket.io messages start with event code (42 = message)
            if (!message.startsWith("42")) return
            
            val json = message.substring(2)
            val parts = Json.parseToJsonElement(json).toString()
            
            when {
                "shop:product_created" in message -> {
                    val product = extractProduct(message)
                    product?.let { _events.emit(ShopSocketEvent.ProductCreated(it)) }
                }
                "shop:product_updated" in message -> {
                    val product = extractProduct(message)
                    product?.let { _events.emit(ShopSocketEvent.ProductUpdated(it)) }
                }
                "shop:product_deleted" in message -> {
                    val productId = extractProductId(message)
                    productId?.let { _events.emit(ShopSocketEvent.ProductDeleted(it)) }
                }
            }
        } catch (e: Exception) {
            logger.e(e) { "Error handling message: $message" }
        }
    }
    
    private fun extractProduct(message: String): Product? {
        return try {
            val jsonStart = message.indexOf("{")
            if (jsonStart == -1) return null
            val jsonStr = message.substring(jsonStart)
            Json.decodeFromString<Product>(jsonStr)
        } catch (e: Exception) {
            logger.e(e) { "Error extracting product" }
            null
        }
    }
    
    private fun extractProductId(message: String): String? {
        return try {
            val regex = "\"productId\":\"([^\"]+)\"".toRegex()
            regex.find(message)?.groupValues?.get(1)
        } catch (e: Exception) {
            logger.e(e) { "Error extracting productId" }
            null
        }
    }
    
    suspend fun disconnect() {
        try {
            session?.send(Frame.Text("42[\"shop:leave\"]"))
            session?.close()
            logger.d { "Disconnected from shop WebSocket" }
        } catch (e: Exception) {
            logger.e(e) { "Error disconnecting" }
        }
    }
}
