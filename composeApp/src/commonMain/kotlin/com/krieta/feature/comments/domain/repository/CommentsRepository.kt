package com.krieta.feature.comments.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.comments.domain.model.Comment
import com.krieta.feature.comments.domain.model.CommentSettings
import com.krieta.feature.comments.domain.model.CommentSortType
import com.krieta.feature.comments.domain.model.ContentType

interface CommentsRepository {
    suspend fun getComments(
        contentType: ContentType,
        contentId: String,
        sortBy: CommentSortType,
        cursor: String?,
        limit: Int
    ): NetworkResult<Pair<List<Comment>, String?>>

    suspend fun getReplies(
        commentId: String,
        cursor: String?,
        limit: Int
    ): NetworkResult<Pair<List<Comment>, String?>>

    suspend fun createComment(
        contentType: ContentType,
        contentId: String,
        text: String,
        parentId: String?,
        replyToUserId: String?
    ): NetworkResult<Comment>

    suspend fun updateComment(
        commentId: String,
        text: String
    ): NetworkResult<Comment>

    suspend fun deleteComment(commentId: String): NetworkResult<Boolean>

    suspend fun likeComment(commentId: String): NetworkResult<Comment>

    suspend fun unlikeComment(commentId: String): NetworkResult<Comment>

    suspend fun pinComment(commentId: String): NetworkResult<Comment>

    suspend fun unpinComment(commentId: String): NetworkResult<Comment>

    suspend fun reportComment(commentId: String, reason: String): NetworkResult<Boolean>

    suspend fun updateCommentSettings(
        contentType: ContentType,
        contentId: String,
        commentsEnabled: Boolean,
        repliesEnabled: Boolean
    ): NetworkResult<Boolean>

    suspend fun getCommentSettings(
        contentType: ContentType,
        contentId: String
    ): NetworkResult<CommentSettings>
}
