package com.krieta.feature.feed.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.feed.data.remote.dto.FeedResponseDto
import com.krieta.feature.feed.data.remote.dto.PostCommentDto
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

    suspend fun createPost(caption: String, imageUrls: List<String>) {
        @Serializable
        data class CreatePostRequest(val caption: String, val imageUrls: List<String>)
        httpClient.post(ApiConstants.FEED) {
            setBody(CreatePostRequest(caption, imageUrls))
        }
    }
}
