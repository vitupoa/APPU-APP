package com.runinga.feature.marketplace.domain.model

import kotlinx.serialization.Serializable

@Serializable
enum class SocialPlatform {
    TIKTOK, YOUTUBE, INSTAGRAM, FACEBOOK, TWITTER, TWITCH, LINKEDIN, SNAPCHAT
}

@Serializable
data class SocialMediaAccount(
    val id: String,
    val influencerId: String,
    val platform: SocialPlatform,
    val username: String,
    val profileUrl: String,
    val displayName: String?,
    val followerCount: Int,
    val subscriberCount: Int,
    val videoCount: Int,
    val totalViews: Long,
    val avgViews: Int,
    val avgLikes: Int,
    val engagementRate: Double,
    val isVerified: Boolean,
    val isPrimary: Boolean,
    val lastSyncedAt: String?,
    val syncStatus: String
)

@Serializable
data class AddSocialAccountRequest(
    val influencerId: String,
    val platform: SocialPlatform,
    val username: String,
    val accessToken: String? = null
)

@Serializable
data class PlatformInfo(
    val platform: SocialPlatform,
    val name: String,
    val icon: String, // Emoji or icon identifier
    val color: String, // Hex color
    val requiresAuth: Boolean,
    val followerLabel: String // "Followers", "Subscribers", etc.
)

val PLATFORM_INFO = mapOf(
    SocialPlatform.TIKTOK to PlatformInfo(
        SocialPlatform.TIKTOK,
        "TikTok",
        "🎵",
        "#000000",
        false,
        "Followers"
    ),
    SocialPlatform.YOUTUBE to PlatformInfo(
        SocialPlatform.YOUTUBE,
        "YouTube",
        "▶️",
        "#FF0000",
        false,
        "Subscribers"
    ),
    SocialPlatform.INSTAGRAM to PlatformInfo(
        SocialPlatform.INSTAGRAM,
        "Instagram",
        "📷",
        "#E4405F",
        true,
        "Followers"
    ),
    SocialPlatform.FACEBOOK to PlatformInfo(
        SocialPlatform.FACEBOOK,
        "Facebook",
        "👥",
        "#1877F2",
        true,
        "Followers"
    ),
    SocialPlatform.TWITTER to PlatformInfo(
        SocialPlatform.TWITTER,
        "X (Twitter)",
        "🐦",
        "#1DA1F2",
        false,
        "Followers"
    ),
    SocialPlatform.TWITCH to PlatformInfo(
        SocialPlatform.TWITCH,
        "Twitch",
        "🎮",
        "#9146FF",
        false,
        "Followers"
    ),
    SocialPlatform.LINKEDIN to PlatformInfo(
        SocialPlatform.LINKEDIN,
        "LinkedIn",
        "💼",
        "#0A66C2",
        true,
        "Connections"
    ),
    SocialPlatform.SNAPCHAT to PlatformInfo(
        SocialPlatform.SNAPCHAT,
        "Snapchat",
        "👻",
        "#FFFC00",
        false,
        "Followers"
    )
)
