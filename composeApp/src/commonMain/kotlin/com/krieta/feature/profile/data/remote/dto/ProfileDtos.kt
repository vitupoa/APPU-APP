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
    val sortOrder: Int = 0
)

@Serializable
data class UserProfileDto(
    val id: String,
    val username: String,
    val firstName: String,
    val lastName: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val coverPhotoUrl: String? = null,
    val bio: String? = null,
    val country: String,
    val currency: String,
    val accountType: String,
    val isVerified: Boolean = false,
    val isWalletUnlocked: Boolean = false,
    val bioLinks: List<BioLinkDto> = emptyList(),
    val stats: ProfileStatsDto = ProfileStatsDto(),
    val relationshipStatus: String = "NONE",
    val createdAt: String
)

@Serializable
data class UpdateProfileRequestDto(
    val firstName: String? = null,
    val lastName: String? = null,
    val displayName: String? = null,
    val username: String? = null,
    val bio: String? = null,
    val avatarUrl: String? = null,
    val coverPhotoUrl: String? = null
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
    val isLovers: Boolean = false
)

@Serializable
data class SocialUserDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val isVerified: Boolean = false,
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
    val requirementType: String,
    val requirementValue: Int,
    val rewardKr: Double,
    val isCompleted: Boolean = false,
    val completedBy: MilestoneCompletedByDto? = null
)

@Serializable
data class MilestoneCompletedByDto(
    val id: String,
    val username: String,
    val displayName: String
)

@Serializable
data class SubscriptionTierDto(
    val id: String,
    val tier: String,
    val krAmount: Double,
    val benefits: String,
    val isEnabled: Boolean = true
)

@Serializable
data class UpdateTierRequestDto(
    val tier: String,
    val krAmount: Double,
    val benefits: String,
    val isEnabled: Boolean
)

@Serializable
data class SubscribeRequestDto(
    val tier: String
)
