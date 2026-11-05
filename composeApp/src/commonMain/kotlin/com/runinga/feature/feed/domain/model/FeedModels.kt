package com.runinga.feature.feed.domain.model

data class PostCreator(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val accountType: String
)

data class Post(
    val id: String,
    val creator: PostCreator,
    val imageUrls: List<String>,
    val caption: String,
    val isLocked: Boolean,
    val requiredTier: String?,
    val likesCount: Int,
    val commentsCount: Int,
    val isLiked: Boolean,
    val createdAt: String,
    val isSponsored: Boolean? = false,
    val sponsorName: String? = null,
    val sponsorLogoUrl: String? = null
)

data class DripAuthor(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean
)

data class Drip(
    val id: String,
    val author: DripAuthor,
    val caption: String,
    val mediaUrl: String,
    val thumbnailUrl: String?,
    val mediaType: String,
    val duration: Int?,
    val aspectRatio: Float?,
    val likesCount: Int,
    val commentsCount: Int,
    val sharesCount: Int,
    val viewsCount: Int,
    val isLiked: Boolean,
    val isBookmarked: Boolean,
    val createdAt: String
)
