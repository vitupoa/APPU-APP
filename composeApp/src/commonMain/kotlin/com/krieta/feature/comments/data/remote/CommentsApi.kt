package com.krieta.feature.comments.data.remote

import com.krieta.com.core.network.ApiConstants
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody

class CommentsApi(private val client: HttpClient) {

    suspend fun getComments(
        contentType: String,
        contentId: String,
        sortBy: String = "latest",
        cursor: String? = null,
        limit: Int = 20
    ): CommentsResponseDto {
        return client.get("${ApiConstants.API_VERSION}/comments") {
            parameter("contentType", contentType)
            parameter("contentId", contentId)
            parameter("sortBy", sortBy)
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun getReplies(
        commentId: String,
        cursor: String? = null,
        limit: Int = 10
    ): CommentsResponseDto {
        return client.get("${ApiConstants.API_VERSION}/comments/$commentId/replies") {
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun createComment(
        contentType: String,
        contentId: String,
        request: CreateCommentRequestDto
    ): CommentActionResponseDto {
        return client.post("${ApiConstants.API_VERSION}/comments") {
            parameter("contentType", contentType)
            parameter("contentId", contentId)
            setBody(request)
        }.body()
    }

    suspend fun updateComment(
        commentId: String,
        request: UpdateCommentRequestDto
    ): CommentActionResponseDto {
        return client.put("${ApiConstants.API_VERSION}/comments/$commentId") {
            setBody(request)
        }.body()
    }

    suspend fun deleteComment(commentId: String): CommentActionResponseDto {
        return client.delete("${ApiConstants.API_VERSION}/comments/$commentId").body()
    }

    suspend fun likeComment(commentId: String): CommentActionResponseDto {
        return client.post("${ApiConstants.API_VERSION}/comments/$commentId/like").body()
    }

    suspend fun unlikeComment(commentId: String): CommentActionResponseDto {
        return client.delete("${ApiConstants.API_VERSION}/comments/$commentId/like").body()
    }

    suspend fun pinComment(commentId: String): CommentActionResponseDto {
        return client.post("${ApiConstants.API_VERSION}/comments/$commentId/pin").body()
    }

    suspend fun unpinComment(commentId: String): CommentActionResponseDto {
        return client.delete("${ApiConstants.API_VERSION}/comments/$commentId/pin").body()
    }

    suspend fun reportComment(commentId: String, reason: String): CommentActionResponseDto {
        return client.post("${ApiConstants.API_VERSION}/comments/$commentId/report") {
            setBody(mapOf("reason" to reason))
        }.body()
    }

    suspend fun updateCommentSettings(
        contentType: String,
        contentId: String,
        commentsEnabled: Boolean,
        repliesEnabled: Boolean
    ): CommentActionResponseDto {
        return client.put("${ApiConstants.API_VERSION}/comments/settings") {
            parameter("contentType", contentType)
            parameter("contentId", contentId)
            setBody(mapOf(
                "commentsEnabled" to commentsEnabled,
                "repliesEnabled" to repliesEnabled
            ))
        }.body()
    }
}
