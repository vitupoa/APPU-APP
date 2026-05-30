package com.krieta.feature.feed.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.feed.data.remote.dto.FeedResponseDto
import com.krieta.feature.feed.data.remote.dto.PostCommentDto
import com.krieta.feature.feed.data.remote.dto.PostDto
import com.krieta.feature.feed.data.remote.dto.ToggleLikeResponseDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.serialization.Serializable

class FeedApi(private val httpClient: HttpClient) {

    suspend fun getFeed(cursor: String? = null, limit: Int = 20): FeedResponseDto {
        return httpClient.get(ApiConstants.FEED) {
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun getPostById(postId: String): com.krieta.feature.feed.data.remote.dto.PostDto {
        return httpClient.get("${ApiConstants.FEED}/$postId").body()
    }

    suspend fun toggleLike(postId: String): ToggleLikeResponseDto {
        return httpClient.post("${ApiConstants.FEED}/$postId/like").body()
    }

    suspend fun addComment(postId: String, text: String): PostCommentDto {
        @Serializable
        data class CommentRequest(val text: String)
        return httpClient.post("${ApiConstants.FEED}/$postId/comment") {
            setBody(CommentRequest(text))
        }.body()
    }

    suspend fun createPost(
        caption: String,
        imageUrls: List<String>,
        isLocked: Boolean = false,
        unlockAmountKr: Double? = null
    ): PostDto {
        @Serializable
        data class CreatePostRequest(
            val caption: String,
            val imageUrls: List<String>,
            val isLocked: Boolean = false,
            val unlockAmountKr: Double? = null
        )
        return httpClient.post(ApiConstants.FEED) {
            setBody(CreatePostRequest(caption, imageUrls, isLocked, unlockAmountKr))
        }.body()
    }

    // Recommendation system endpoints
    suspend fun getDiscoverFeed(limit: Int, cursor: String?): DiscoverFeedResponse {
        return httpClient.get("${ApiConstants.BASE_URL}/recommendation/feed/discover") {
            parameter("limit", limit)
            cursor?.let { parameter("cursor", it) }
        }.body()
    }

    suspend fun getAdmiringFeed(limit: Int, cursor: String?): DiscoverFeedResponse {
        return httpClient.get("${ApiConstants.BASE_URL}/recommendation/feed/admiring") {
            parameter("limit", limit)
            cursor?.let { parameter("cursor", it) }
        }.body()
    }

    suspend fun trackInteraction(
        contentId: String,
        contentType: String,
        signalType: String,
        watchDuration: Long,
        totalDuration: Long
    ) {
        @Serializable
        data class TrackInteractionRequest(
            val contentId: String,
            val contentType: String,
            val signalType: String,
            val watchDuration: Long,
            val totalDuration: Long
        )
        httpClient.post("${ApiConstants.BASE_URL}/recommendation/interactions/track") {
            setBody(TrackInteractionRequest(contentId, contentType, signalType, watchDuration, totalDuration))
        }
    }
}

@Serializable
data class DiscoverFeedResponse(
    val content: List<DiscoverFeedItem>,
    val nextCursor: String?,
    val composition: CompositionDto
)

@Serializable
data class DiscoverFeedItem(
    val id: String,
    val type: String,
    val videoUrl: String? = null,
    val thumbnailUrl: String? = null,
    val caption: String,
    val userName: String,
    val userAvatar: String? = null,
    val userId: String,
    val isAdmired: Boolean = false,
    val likesCount: Int = 0,
    val commentsCount: Int = 0,
    val isLiked: Boolean = false,
    val isLocked: Boolean = false,
    val isContest: Boolean = false,
    val isAd: Boolean = false
)

@Serializable
data class CompositionDto(
    val personalized: Int,
    val admiring: Int,
    val trending: Int,
    val discovery: Int
)
