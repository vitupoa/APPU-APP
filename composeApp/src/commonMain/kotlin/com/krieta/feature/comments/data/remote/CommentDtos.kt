package com.krieta.feature.comments.data.remote

import kotlinx.serialization.Serializable

@Serializable
data class CommentDto(
    val id: String,
    val contentId: String? = null,
    val content_id: String? = null,
    val contentType: String,
    val author: CommentAuthorDto,
    val text: String,
    val parentId: String? = null,
    val parent_id: String? = null,
    val replyToUser: CommentAuthorDto? = null,
    val likesCount: Int = 0,
    val repliesCount: Int = 0,
    val isLiked: Boolean = false,
    val isPinned: Boolean = false,
    val isEdited: Boolean = false,
    val canDelete: Boolean = false,
    val canEdit: Boolean = false,
    val canPin: Boolean = false,
    val canReply: Boolean = false,
    val createdAt: String,
    val editedAt: String? = null
)

@Serializable
data class CommentAuthorDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val isVerified: Boolean,
    val isContentOwner: Boolean = false
)

@Serializable
data class CommentsResponseDto(
    val comments: List<CommentDto>,
    val settings: CommentSettingsDto,
    val nextCursor: String? = null
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
    val parent_id: String? = null,
    val replyToUserId: String? = null
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
