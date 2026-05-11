package com.krieta.feature.comments.data.remote

import kotlinx.serialization.Serializable

@Serializable
data class CommentDto(
    val id: String,
    val contentId: String,
    val contentType: String,
    val author: CommentAuthorDto,
    val text: String,
    val parentId: String?,
    val replyToUser: CommentAuthorDto?,
    val likesCount: Int,
    val repliesCount: Int,
    val isLiked: Boolean,
    val isPinned: Boolean,
    val isEdited: Boolean,
    val canDelete: Boolean? = false,
    val canEdit: Boolean? = false,
    val canPin: Boolean? = false,
    val canReply: Boolean? = false,
    val createdAt: String,
    val editedAt: String?
)

@Serializable
data class CommentAuthorDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val isContentOwner: Boolean = false
)

@Serializable
data class CommentsResponseDto(
    val comments: List<CommentDto>,
    val settings: CommentSettingsDto,
    val nextCursor: String?
)

@Serializable
data class CommentSettingsDto(
    val commentsEnabled: Boolean,
    val repliesEnabled: Boolean,
    val totalComments: Int
)

@Serializable
data class CreateCommentRequestDto(
    val text: String,
    val parentId: String?,
    val replyToUserId: String?
)

@Serializable
data class UpdateCommentRequestDto(
    val text: String
)

@Serializable
data class CommentActionResponseDto(
    val success: Boolean = true,
    val comment: CommentDto? = null
)
