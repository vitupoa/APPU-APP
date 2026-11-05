package com.runinga.feature.marketplace.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class InfluencerProfile(
    val id: String,
    val userId: String,
    val username: String,
    val profileImage: String?,
    val tier: InfluencerTier,
    val categories: List<String>,
    val followersCount: Int,
    val engagementRate: Double,
    val avgViews: Int,
    val completedCampaigns: Int,
    val rating: Double,
    val bio: String?,
    val isVerified: Boolean
)

@Serializable
enum class InfluencerTier {
    NANO, MICRO, MID, MACRO, MEGA
}

@Serializable
data class BrandCampaign(
    val id: String,
    val brandId: String,
    val title: String,
    val description: String,
    val type: String,
    val status: CampaignStatus,
    val targetTiers: List<String>,
    val targetCategories: List<String>,
    val minFollowers: Int? = null,
    val minEngagementRate: Double? = null,
    val targetGeos: List<String> = emptyList(),
    val budgetKr: Double,
    val compensationPerInfluencer: Double,
    val maxInfluencers: Int,
    val requiredPosts: Int = 0,
    val requiredVideos: Int = 0,
    val requiredStories: Int = 0,
    val contentGuidelines: String? = null,
    val hashtags: List<String> = emptyList(),
    val mentions: List<String> = emptyList(),
    val contestId: String? = null,
    val applicationDeadline: String? = null,
    val campaignStartDate: String,
    val campaignEndDate: String,
    val totalApplications: Int = 0,
    val acceptedInfluencers: Int = 0,
    val totalReach: Int = 0,
    val totalEngagement: Int = 0,
    val totalConversions: Int = 0,
    val totalRevenueKr: Double = 0.0,
    val roi: Double = 0.0,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    // Computed properties for backward compatibility
    val brandName: String get() = "" // Will be populated from brand relation if needed
    val budget: Double get() = budgetKr
    val targetTier: InfluencerTier? get() = targetTiers.firstOrNull()?.let { 
        try { InfluencerTier.valueOf(it) } catch (e: Exception) { null }
    }
    val categories: List<String> get() = targetCategories
    val requirements: String get() = contentGuidelines ?: ""
    val deliverables: String get() = buildString {
        if (requiredPosts > 0) append("$requiredPosts posts ")
        if (requiredVideos > 0) append("$requiredVideos videos ")
        if (requiredStories > 0) append("$requiredStories stories")
    }.trim()
    val startDate: String get() = campaignStartDate
    val endDate: String get() = campaignEndDate
    val applicationsCount: Int get() = totalApplications
    val selectedInfluencers: Int get() = acceptedInfluencers
}

@Serializable
enum class CampaignStatus {
    DRAFT, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED
}

@Serializable
data class CampaignApplication(
    val id: String,
    val campaignId: String,
    val influencerId: String,
    val proposedRate: Double,
    val pitch: String,
    val status: ApplicationStatus,
    val appliedAt: String
)

@Serializable
enum class ApplicationStatus {
    PENDING, ACCEPTED, REJECTED, WITHDRAWN
}

@Serializable
data class ContestSponsorship(
    val id: String,
    val contestId: String,
    val contestTitle: String,
    val brandId: String,
    val brandName: String,
    val sponsorshipAmount: Double,
    val productUrl: String?,
    val purchaseToEnterEnabled: Boolean,
    val status: String
)

@Serializable
data class ConversionCampaign(
    val id: String,
    val brandId: String,
    val contestId: String,
    val targetSegment: String,
    val offerType: String,
    val discountPercent: Int?,
    val message: String,
    val startDate: String,
    val endDate: String,
    val conversions: Int,
    val revenue: Double
)

@Serializable
data class GamificationStats(
    val userId: String,
    val totalPoints: Int,
    val level: Int,
    val contestsWon: Int,
    val isInfluencer: Boolean,
    val recentActions: List<PointAction>
)

@Serializable
data class PointAction(
    val action: String,
    val points: Int,
    val timestamp: String
)

@Serializable
data class ROIMetrics(
    val campaignId: String,
    val totalSpend: Double,
    val totalRevenue: Double,
    val roi: Double,
    val conversions: Int,
    val impressions: Int,
    val engagements: Int,
    val costPerConversion: Double
)
