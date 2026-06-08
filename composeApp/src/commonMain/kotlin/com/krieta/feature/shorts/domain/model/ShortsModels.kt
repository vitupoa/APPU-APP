package com.krieta.feature.shorts.domain.model

data class ShortCreator(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val accountType: String
)

data class LinkedProduct(
    val id: String,
    val title: String,
    val imageUrl: String?,
    val priceKr: Double
)

data class Short(
    val id: String,
    val creator: ShortCreator,
    val videoUrl: String,
    val thumbnailUrl: String?,
    val mediaType: String = "VIDEO", // VIDEO, PHOTO, CAROUSEL
    val aspectRatio: Float? = null, // width/height
    val mediaUrls: List<String> = emptyList(), // For photo carousels
    val caption: String,
    val musicTrack: String?,
    val contestId: String?,
    val collectionId: String?,
    val linkedProduct: LinkedProduct?,
    val isLocked: Boolean,
    val requiredTier: String?,
    val likesCount: Int,
    val commentsCount: Int,
    val views: Int,
    val isLiked: Boolean,
    val createdAt: String
)

data class ShortComment(
    val id: String,
    val user: ShortCreator,
    val text: String,
    val createdAt: String
)

data class ShortCollection(
    val id: String,
    val userId: String,
    val name: String,
    val coverUrl: String?,
    val order: Int
)

data class ToggleLikeResponse(
    val liked: Boolean,
    val likesCount: Int? = null
)
