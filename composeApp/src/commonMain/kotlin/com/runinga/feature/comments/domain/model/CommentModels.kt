package com.runinga.feature.comments.domain.model

import kotlinx.datetime.Instant

enum class ContentType {
    POST,
    SHORT,
    CONTEST_SUBMISSION
}

enum class CommentSortType {
    LATEST,
    TOP,
    OLDEST
}

data class Comment(
    val id: String,
    val contentId: String,
    val contentType: ContentType,
    val author: CommentAuthor,
    val text: String,
    val parentId: String?,
    val replyToUser: CommentAuthor?,
    val likesCount: Int,
    val repliesCount: Int,
    val isLiked: Boolean,
    val isPinned: Boolean,
    val isEdited: Boolean,
    val canDelete: Boolean,
    val canEdit: Boolean,
    val canPin: Boolean,
    val canReply: Boolean,
    val createdAt: Instant,
    val editedAt: Instant?,
    val replies: List<Comment> = emptyList(),
    val isExpanded: Boolean = false,
    val isHighlighted: Boolean = false
)

data class CommentAuthor(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val isContentOwner: Boolean
)

data class CommentSettings(
    val commentsEnabled: Boolean,
    val repliesEnabled: Boolean,
    val totalComments: Int
)
