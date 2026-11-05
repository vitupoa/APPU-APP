package com.runinga.feature.profile.domain.model

data class ProfileStats(
    val admirers: Int,
    val admiring: Int,
    val lovers: Int,
    val contestsWon: Int
)

data class BioLink(
    val id: String,
    val label: String,
    val url: String,
    val icon: String?,
    val sortOrder: Int
)

enum class RelationshipStatus {
    NONE, ADMIRING, ADMIRED_BY, LOVERS
}

enum class AccountType { CREATOR, BUSINESS }

data class UserProfile(
    val id: String,
    val username: String,
    val firstName: String,
    val lastName: String,
    val avatarUrl: String?,
    val coverPhotoUrl: String?,
    val bio: String?,
    val country: String,
    val currency: String,
    val accountType: AccountType,
    val isVerified: Boolean,
    val isWalletUnlocked: Boolean,
    val bioLinks: List<BioLink>,
    val stats: ProfileStats,
    val relationshipStatus: RelationshipStatus,
    val hasUnwatchedStories: Boolean = false,
    val selectedNiches: List<String> = emptyList(),
    val customNiches: List<String> = emptyList(),
    val createdAt: String
) {
    val displayName: String get() = "$firstName $lastName".trim()
}

data class SocialUser(
    val id: String,
    val username: String,
    val firstName: String,
    val lastName: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val isLovers: Boolean
) {
    val displayName: String get() = "$firstName $lastName".trim()
}

data class Milestone(
    val id: String,
    val title: String,
    val description: String,
    val requirementType: String,
    val requirementValue: Int,
    val rewardKr: Double,
    val isCompleted: Boolean,
    val completedByUsername: String?
)

enum class SubscriptionTierType { TOP_FUN, REAL_FAN, TRUE_FAN, SUPER_FAN }

data class SubscriptionTier(
    val id: String,
    val tier: SubscriptionTierType,
    val krAmount: Double,
    val benefits: String,
    val isEnabled: Boolean
)
