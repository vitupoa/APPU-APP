package com.krieta.feature.shorts.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.shorts.data.remote.dto.CommentsResponseDto
import com.krieta.feature.shorts.data.remote.dto.CreateShortRequestDto
import com.krieta.feature.shorts.data.remote.dto.ShortCollectionDto
import com.krieta.feature.shorts.data.remote.dto.ShortDto
import com.krieta.feature.shorts.data.remote.dto.ShortsFeedResponseDto
import com.krieta.feature.shorts.data.remote.dto.ToggleLikeResponseDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class ShortsApi(private val httpClient: HttpClient) {

    suspend fun getFeed(tab: String, cursor: String? = null, limit: Int = 15): ShortsFeedResponseDto {
        return httpClient.get(ApiConstants.SHORTS_FEED) {
            parameter("tab", tab)
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun createShort(request: CreateShortRequestDto): ShortDto {
        return httpClient.post(ApiConstants.SHORTS) {
            setBody(request)
        }.body()
    }

    suspend fun toggleLike(shortId: String): ToggleLikeResponseDto {
        return httpClient.post("${ApiConstants.SHORTS}/$shortId/like").body()
    }

    suspend fun addComment(shortId: String, text: String): com.krieta.feature.shorts.data.remote.dto.CommentDto {
        @kotlinx.serialization.Serializable
        data class CommentRequest(val text: String)
        return httpClient.post("${ApiConstants.SHORTS}/$shortId/comment") {
            setBody(CommentRequest(text))
        }.body()
    }

    suspend fun getComments(shortId: String, cursor: String? = null, limit: Int = 20): CommentsResponseDto {
        return httpClient.get("${ApiConstants.SHORTS}/$shortId/comments") {
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun incrementView(shortId: String) {
        try {
            httpClient.post("${ApiConstants.SHORTS}/$shortId/view")
        } catch (_: Exception) {
            // Fire-and-forget — non-critical
        }
    }

    suspend fun getCollections(userId: String): List<ShortCollectionDto> {
        return httpClient.get("${ApiConstants.SHORTS_COLLECTIONS}/$userId").body()
    }
}
