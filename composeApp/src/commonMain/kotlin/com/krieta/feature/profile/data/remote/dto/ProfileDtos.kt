package com.krieta.feature.profile.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ProfileStatsDto(
    val admirers: Int = 0,
    val admiring: Int = 0,
    val lovers: Int = 0,
    val contestsWon: Int = 0
)

@Serializable
data class BioLinkDto(
    val id: String,
    val label: String,
    val url: String,
    val icon: String? = null,
    @kotlinx.serialization.SerialName("sort_order")
    val sortOrder: Int = 0
)

@Serializable
data class UserProfileDto(
    val id: String? = null,
    val username: String? = null,
    @kotlinx.serialization.SerialName("first_name")
    val firstName: String? = null,
    @kotlinx.serialization.SerialName("last_name")
    val lastName: String? = null,
    @kotlinx.serialization.SerialName("display_name")
    val displayName: String? = null,
    @kotlinx.serialization.SerialName("avatar_url")
    val avatarUrl: String? = null,
    @kotlinx.serialization.SerialName("cover_photo_url")
    val coverPhotoUrl: String? = null,
    val bio: String? = null,
    val country: String? = null,
    val currency: String? = null,
    @kotlinx.serialization.SerialName("account_type")
    val accountType: String? = null,
    @kotlinx.serialization.SerialName("is_verified")
    val isVerified: Boolean = false,
    @kotlinx.serialization.SerialName("is_wallet_unlocked")
    val isWalletUnlocked: Boolean = false,
    val bioLinks: List<BioLinkDto> = emptyList(),
    val stats: ProfileStatsDto = ProfileStatsDto(),
    val relationshipStatus: String = "NONE",
    val selectedNiches: List<String> = emptyList(),
    val customNiches: List<String> = emptyList(),
    @kotlinx.serialization.SerialName("created_at")
    val createdAt: String? = null
)

@Serializable
data class UpdateProfileRequestDto(
    @kotlinx.serialization.SerialName("first_name")
    val firstName: String? = null,
    @kotlinx.serialization.SerialName("last_name")
    val lastName: String? = null,
    @kotlinx.serialization.SerialName("display_name")
    val displayName: String? = null,
    val username: String? = null,
    val bio: String? = null,
    @kotlinx.serialization.SerialName("avatar_url")
    val avatarUrl: String? = null,
    @kotlinx.serialization.SerialName("cover_photo_url")
    val coverPhotoUrl: String? = null,
    val selectedNiches: List<String>? = null,
    val customNiches: List<String>? = null
)

@Serializable
data class BioLinkRequestDto(
    val label: String,
    val url: String,
    val icon: String? = null
)

@Serializable
data class AdmireResponseDto(
    val admired: Boolean,
    @kotlinx.serialization.SerialName("is_lovers")
    val isLovers: Boolean = false
)

@Serializable
data class SocialUserDto(
    val id: String,
    val username: String,
    @kotlinx.serialization.SerialName("display_name")
    val displayName: String,
    @kotlinx.serialization.SerialName("avatar_url")
    val avatarUrl: String? = null,
    @kotlinx.serialization.SerialName("is_verified")
    val isVerified: Boolean = false,
    @kotlinx.serialization.SerialName("is_lovers")
    val isLovers: Boolean = false
)

@Serializable
data class SocialListResponseDto(
    val items: List<SocialUserDto>,
    val nextCursor: String? = null
)

@Serializable
data class MilestoneDto(
    val id: String,
    val title: String,
    val description: String,
    @kotlinx.serialization.SerialName("requirement_type")
    val requirementType: String,
    @kotlinx.serialization.SerialName("requirement_value")
    val requirementValue: Int,
    @kotlinx.serialization.SerialName("reward_kr")
    val rewardKr: Double,
    @kotlinx.serialization.SerialName("is_completed")
    val isCompleted: Boolean = false,
    @kotlinx.serialization.SerialName("completed_by")
    val completedBy: MilestoneCompletedByDto? = null
)

@Serializable
data class MilestoneCompletedByDto(
    val id: String,
    val username: String,
    @kotlinx.serialization.SerialName("display_name")
    val displayName: String
)

@Serializable
data class SubscriptionTierDto(
    val id: String,
    val tier: String,
    @kotlinx.serialization.SerialName("kr_amount")
    val krAmount: Double,
    val benefits: String,
    @kotlinx.serialization.SerialName("is_enabled")
    val isEnabled: Boolean = true
)

@Serializable
data class UpdateTierRequestDto(
    val tier: String,
    @kotlinx.serialization.SerialName("kr_amount")
    val krAmount: Double,
    val benefits: String,
    @kotlinx.serialization.SerialName("is_enabled")
    val isEnabled: Boolean
)

@Serializable
data class SubscribeRequestDto(
    val tier: String
)
