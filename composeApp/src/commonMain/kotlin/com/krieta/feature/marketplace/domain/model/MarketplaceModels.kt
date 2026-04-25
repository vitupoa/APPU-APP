package com.krieta.feature.marketplace.domain.model

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
    val brandName: String,
    val title: String,
    val description: String,
    val budget: Double,
    val targetTier: InfluencerTier?,
    val categories: List<String>,
    val requirements: String,
    val deliverables: String,
    val startDate: String,
    val endDate: String,
    val status: CampaignStatus,
    val applicationsCount: Int,
    val selectedInfluencers: Int
)

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
