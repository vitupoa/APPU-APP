package com.krieta.feature.live.data.api

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import kotlinx.serialization.Serializable

interface LiveApiService {
    suspend fun startStream(request: StartStreamRequest): StartStreamResponse
    suspend fun endStream(streamId: String): EndStreamResponse
    suspend fun getActiveStreams(page: Int, limit: Int, chamaId: String?): ActiveStreamsResponse
    suspend fun getStreamDetails(streamId: String): StreamDetailsResponse
    suspend fun updateViewerCount(streamId: String): UpdateViewerResponse
    suspend fun pinProduct(streamId: String, productId: String): PinProductResponse
    suspend fun unpinProduct(streamId: String): UnpinProductResponse
    suspend fun setGiftGoal(streamId: String, title: String, targetKr: Double): SetGiftGoalResponse
}

class LiveApiServiceImpl(private val client: HttpClient) : LiveApiService {
    
    override suspend fun startStream(request: StartStreamRequest): StartStreamResponse {
        return client.post("/api/v1/live/start") {
            setBody(request)
        }.body()
    }
    
    override suspend fun endStream(streamId: String): EndStreamResponse {
        return client.post("/api/v1/live/$streamId/end").body()
    }
    
    override suspend fun getActiveStreams(
        page: Int,
        limit: Int,
        chamaId: String?
    ): ActiveStreamsResponse {
        return client.get("/api/v1/live/active") {
            parameter("page", page)
            parameter("limit", limit)
            chamaId?.let { parameter("chamaId", it) }
        }.body()
    }
    
    override suspend fun getStreamDetails(streamId: String): StreamDetailsResponse {
        return client.get("/api/v1/live/$streamId").body()
    }
    
    override suspend fun updateViewerCount(streamId: String): UpdateViewerResponse {
        return client.post("/api/v1/live/$streamId/viewer").body()
    }
    
    override suspend fun pinProduct(streamId: String, productId: String): PinProductResponse {
        return client.post("/api/v1/live/$streamId/pin-product") {
            setBody(mapOf("productId" to productId))
        }.body()
    }
    
    override suspend fun unpinProduct(streamId: String): UnpinProductResponse {
        return client.delete("/api/v1/live/$streamId/pin-product").body()
    }
    
    override suspend fun setGiftGoal(
        streamId: String,
        title: String,
        targetKr: Double
    ): SetGiftGoalResponse {
        return client.post("/api/v1/live/$streamId/gift-goal") {
            setBody(mapOf("title" to title, "targetKr" to targetKr))
        }.body()
    }
}

@Serializable
data class StartStreamRequest(
    val title: String,
    val description: String? = null,
    val type: String = "NORMAL",
    val isCoHostEnabled: Boolean = false,
    val productId: String? = null
)

@Serializable
data class StartStreamResponse(
    val success: Boolean,
    val stream: StreamDto
)

@Serializable
data class EndStreamResponse(
    val success: Boolean,
    val message: String
)

@Serializable
data class ActiveStreamsResponse(
    val success: Boolean,
    val streams: List<StreamDto>,
    val pagination: PaginationDto
)

@Serializable
data class StreamDetailsResponse(
    val success: Boolean,
    val stream: StreamDto
)

@Serializable
data class UpdateViewerResponse(
    val success: Boolean,
    val viewerCount: Int
)

@Serializable
data class PinProductResponse(
    val success: Boolean,
    val product: ProductDto
)

@Serializable
data class UnpinProductResponse(
    val success: Boolean
)

@Serializable
data class SetGiftGoalResponse(
    val success: Boolean,
    val giftGoal: GiftGoalDto
)

@Serializable
data class StreamDto(
    val id: String,
    val hostId: String,
    val title: String,
    val description: String?,
    val thumbnailUrl: String?,
    val type: String,
    val status: String,
    val streamKey: String,
    val streamUrl: String?,
    val playbackUrl: String?,
    val viewerCount: Int,
    val peakViewers: Int,
    val likesCount: Int,
    val totalTipsKr: Double,
    val giftGoalTitle: String?,
    val giftGoalTarget: Double?,
    val giftGoalCurrent: Double,
    val isCoHostEnabled: Boolean,
    val host: HostDto?,
    val pinnedProduct: ProductDto?
)

@Serializable
data class HostDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean
)

@Serializable
data class ProductDto(
    val id: String,
    val title: String,
    val priceKr: Double,
    val imageUrl: String?,
    val whatsappNumber: String?
)

@Serializable
data class GiftGoalDto(
    val title: String,
    val targetKr: Double,
    val currentKr: Double
)

@Serializable
data class PaginationDto(
    val page: Int,
    val limit: Int,
    val total: Int,
    val totalPages: Int
)
