package com.krieta.feature.shorts.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class CreatorDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val isVerified: Boolean = false,
    val accountType: String = "PERSONAL"
)

@Serializable
data class LinkedProductDto(
    val id: String,
    val title: String,
    val imageUrl: String? = null,
    val priceKr: Double
)

@Serializable
data class ShortDto(
    val id: String,
    val creator: CreatorDto,
    val videoUrl: String,
    val thumbnailUrl: String? = null,
    val caption: String,
    val musicTrack: String? = null,
    val contestId: String? = null,
    val collectionId: String? = null,
    val linkedProductId: String? = null,
    val linkedProduct: LinkedProductDto? = null,
    val isLocked: Boolean = false,
    val requiredTier: String? = null,
    val likesCount: Int = 0,
    val commentsCount: Int = 0,
    val views: Int = 0,
    val isLiked: Boolean = false,
    val createdAt: String
)

@Serializable
data class ShortsFeedResponseDto(
    val items: List<ShortDto>,
    val nextCursor: String? = null
)

@Serializable
data class CommentDto(
    val id: String,
    val user: CreatorDto,
    val text: String,
    val createdAt: String
)

@Serializable
data class CommentsResponseDto(
    val items: List<CommentDto>,
    val nextCursor: String? = null
)

@Serializable
data class ShortCollectionDto(
    val id: String,
    val userId: String,
    val name: String,
    val coverUrl: String? = null,
    val order: Int = 0
)

@Serializable
data class CreateShortRequestDto(
    val videoUrl: String,
    val thumbnailUrl: String? = null,
    val caption: String,
    val musicTrack: String? = null,
    val contestId: String? = null,
    val collectionId: String? = null,
    val linkedProductId: String? = null,
    val isLocked: Boolean = false,
    val requiredTier: String? = null
)

@Serializable
data class ToggleLikeResponseDto(
    val liked: Boolean
)
