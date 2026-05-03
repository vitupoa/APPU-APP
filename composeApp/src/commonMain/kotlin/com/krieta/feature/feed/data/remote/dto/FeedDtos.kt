package com.krieta.feature.feed.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class PostCreatorDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val isVerified: Boolean = false,
    val accountType: String
)

@Serializable
data class PostDto(
    val id: String,
    val creator: PostCreatorDto,
    val imageUrls: List<String>,
    val caption: String,
    val isLocked: Boolean = false,
    val requiredTier: String? = null,
    val likesCount: Int = 0,
    val commentsCount: Int = 0,
    val isLiked: Boolean = false,
    val commentsEnabled: Boolean = true,
    val createdAt: String
)

@Serializable
data class FeedResponseDto(
    val items: List<PostDto>,
    val nextCursor: String? = null
)

@Serializable
data class PostCommentDto(
    val id: String,
    val user: PostCreatorDto,
    val text: String,
    val createdAt: String
)

@Serializable
data class ToggleLikeResponseDto(val liked: Boolean)
