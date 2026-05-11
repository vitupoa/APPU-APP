package com.krieta.feature.comments.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.comments.data.remote.CommentAuthorDto
import com.krieta.feature.comments.data.remote.CommentDto
import com.krieta.feature.comments.data.remote.CommentsApi
import com.krieta.feature.comments.data.remote.CreateCommentRequestDto
import com.krieta.feature.comments.data.remote.UpdateCommentRequestDto
import com.krieta.feature.comments.domain.model.Comment
import com.krieta.feature.comments.domain.model.CommentAuthor
import com.krieta.feature.comments.domain.model.CommentSettings
import com.krieta.feature.comments.domain.model.CommentSortType
import com.krieta.feature.comments.domain.model.ContentType
import com.krieta.feature.comments.domain.repository.CommentsRepository
import kotlinx.datetime.Instant

class CommentsRepositoryImpl(
    private val api: CommentsApi
) : CommentsRepository {

    override suspend fun getComments(
        contentType: ContentType,
        contentId: String,
        sortBy: CommentSortType,
        cursor: String?,
        limit: Int
    ): NetworkResult<Pair<List<Comment>, String?>> = safeApiCall {
        val response = api.getComments(
            contentType = contentType.name.lowercase(),
            contentId = contentId,
            sortBy = sortBy.name.lowercase(),
            cursor = cursor,
            limit = limit
        )
        response.comments.map { it.toDomain() } to response.nextCursor
    }

    override suspend fun getReplies(
        commentId: String,
        cursor: String?,
        limit: Int
    ): NetworkResult<Pair<List<Comment>, String?>> = safeApiCall {
        val response = api.getReplies(commentId, cursor, limit)
        response.comments.map { it.toDomain() } to response.nextCursor
    }

    override suspend fun createComment(
        contentType: ContentType,
        contentId: String,
        text: String,
        parentId: String?,
        replyToUserId: String?
    ): NetworkResult<Comment> = safeApiCall {
        val response = api.createComment(
            contentType = contentType.name.lowercase(),
            contentId = contentId,
            request = CreateCommentRequestDto(text, parentId, replyToUserId)
        )
        response.comment!!.toDomain()
    }

    override suspend fun updateComment(
        commentId: String,
        text: String
    ): NetworkResult<Comment> = safeApiCall {
        val response = api.updateComment(commentId, UpdateCommentRequestDto(text))
        response.comment!!.toDomain()
    }

    override suspend fun deleteComment(commentId: String): NetworkResult<Boolean> = safeApiCall {
        val response = api.deleteComment(commentId)
        response.success
    }

    override suspend fun likeComment(commentId: String): NetworkResult<Comment> = safeApiCall {
        val response = api.likeComment(commentId)
        response.comment!!.toDomain()
    }

    override suspend fun unlikeComment(commentId: String): NetworkResult<Comment> = safeApiCall {
        val response = api.unlikeComment(commentId)
        response.comment!!.toDomain()
    }

    override suspend fun pinComment(commentId: String): NetworkResult<Comment> = safeApiCall {
        val response = api.pinComment(commentId)
        response.comment!!.toDomain()
    }

    override suspend fun unpinComment(commentId: String): NetworkResult<Comment> = safeApiCall {
        val response = api.unpinComment(commentId)
        response.comment!!.toDomain()
    }

    override suspend fun reportComment(commentId: String, reason: String): NetworkResult<Boolean> = safeApiCall {
        val response = api.reportComment(commentId, reason)
        response.success
    }

    override suspend fun updateCommentSettings(
        contentType: ContentType,
        contentId: String,
        commentsEnabled: Boolean,
        repliesEnabled: Boolean
    ): NetworkResult<Boolean> = safeApiCall {
        val response = api.updateCommentSettings(
            contentType = contentType.name.lowercase(),
            contentId = contentId,
            commentsEnabled = commentsEnabled,
            repliesEnabled = repliesEnabled
        )
        response.success
    }

    override suspend fun getCommentSettings(
        contentType: ContentType,
        contentId: String
    ): NetworkResult<CommentSettings> = safeApiCall {
        val response = api.getComments(
            contentType = contentType.name.lowercase(),
            contentId = contentId,
            limit = 1
        )
        CommentSettings(
            commentsEnabled = response.settings.commentsEnabled ?: false,
            repliesEnabled = response.settings.repliesEnabled ?: false,
            totalComments = response.settings.totalComments ?: 0
        )
    }

    private fun CommentDto.toDomain() = Comment(
        id = id,
        contentId = contentId,
        contentType = ContentType.valueOf(contentType.uppercase()),
        author = author.toDomain(),
        text = text,
        parentId = parentId,
        replyToUser = replyToUser?.toDomain(),
        likesCount = likesCount,
        repliesCount = repliesCount,
        isLiked = isLiked ?: false,
        isPinned = isPinned ?: false,
        isEdited = isEdited ?: false,
        canDelete = canDelete ?: false,
        canEdit = canEdit ?: false,
        canPin = canPin ?: false,
        canReply = canReply ?: false,
        createdAt = Instant.parse(createdAt),
        editedAt = editedAt?.let { Instant.parse(it) }
    )

    private fun CommentAuthorDto.toDomain() = CommentAuthor(
        id = id,
        username = username,
        displayName = displayName,
        avatarUrl = avatarUrl,
        isVerified = isVerified,
        isContentOwner = isContentOwner
    )
}
