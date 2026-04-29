package com.krieta.feature.explore.domain.model

data class TrendingHashtag(
    val tag: String,
    val viewCount: Long,
    val postCount: Int
)

data class TrendingShort(
    val id: String,
    val thumbnailUrl: String,
    val viewCount: Long,
    val creatorUsername: String,
    val creatorAvatar: String
)

data class TrendingContest(
    val id: String,
    val title: String,
    val thumbnailUrl: String?,
    val prizeKr: Double,
    val participantsCount: Int,
    val category: String
)

data class TrendingCreator(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val followerCount: Int,
    val isVerified: Boolean,
    val bio: String?
)

data class LiveStream(
    val id: String,
    val creatorId: String,
    val creatorUsername: String,
    val creatorAvatar: String?,
    val thumbnailUrl: String,
    val viewerCount: Int,
    val title: String,
    val category: String
)

enum class ContentCategory(val displayName: String, val emoji: String) {
    ALL("All", "🌟"),
    COMEDY("Comedy", "😂"),
    DANCE("Dance", "💃"),
    FOOD("Food", "🍔"),
    TECH("Tech", "💻"),
    FITNESS("Fitness", "💪"),
    FASHION("Fashion", "👗"),
    MUSIC("Music", "🎵"),
    ART("Art", "🎨"),
    BUSINESS("Business", "💼"),
    EDUCATION("Education", "📚"),
    GAMING("Gaming", "🎮")
}
