package com.krieta.feature.admin.domain.model

data class AdConfig(
    val id: String,
    val nativeAdCpmMin: Double = 40.0,
    val nativeAdCpmMax: Double = 150.0,
    val bannerAdCpmMin: Double = 30.0,
    val bannerAdCpmMax: Double = 100.0,
    val storyAdCpmMin: Double = 80.0,
    val storyAdCpmMax: Double = 200.0,
    val sponsoredPostMinPrice: Double = 2000.0,
    val sponsoredPostMaxPrice: Double = 50000.0,
    val platformCutPercentage: Double = 15.0, // Platform takes 15%, creator gets 85%
    val nativeAdFrequency: Int = 6, // Every 6 posts
    val bannerAdFrequency: Int = 15, // Every 15 posts
    val storyAdFrequency: Int = 20, // Every 20 posts
    val maxAdLoadPercentage: Double = 20.0, // Max 20% ad load
    val isEnabled: Boolean = true,
    val updatedAt: String,
    val updatedBy: String
)

data class AdCampaign(
    val id: String,
    val advertiserId: String,
    val advertiserName: String,
    val advertiserLogoUrl: String?,
    val campaignName: String,
    val adType: AdType,
    val status: AdStatus,
    val budget: Double,
    val spent: Double,
    val impressions: Long,
    val clicks: Long,
    val ctr: Double,
    val cpm: Double,
    val targetAudience: TargetAudience,
    val creative: AdCreative,
    val startDate: String,
    val endDate: String?,
    val createdAt: String,
    val approvedBy: String?,
    val approvedAt: String?
)

enum class AdType {
    NATIVE_FEED,
    BANNER,
    STORY_STYLE,
    SPONSORED_POST,
    VIDEO
}

enum class AdStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    ACTIVE,
    PAUSED,
    COMPLETED,
    REJECTED
}

data class TargetAudience(
    val ageMin: Int = 18,
    val ageMax: Int = 65,
    val gender: Gender = Gender.ALL,
    val locations: List<String> = emptyList(), // Estate-level targeting
    val interests: List<String> = emptyList(),
    val deviceTypes: List<String> = emptyList()
)

enum class Gender {
    ALL, MALE, FEMALE
}

data class AdCreative(
    val headline: String,
    val description: String,
    val imageUrl: String?,
    val videoUrl: String?,
    val ctaText: String,
    val ctaUrl: String,
    val logoUrl: String?
)

data class SponsoredPostRequest(
    val postId: String,
    val creatorId: String,
    val brandId: String,
    val brandName: String,
    val brandLogoUrl: String?,
    val amount: Double,
    val platformCut: Double,
    val creatorEarnings: Double,
    val status: SponsoredPostStatus,
    val createdAt: String,
    val approvedAt: String?
)

enum class SponsoredPostStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    POSTED,
    COMPLETED,
    PAID
}

data class AdAnalytics(
    val campaignId: String,
    val impressions: Long,
    val clicks: Long,
    val conversions: Long,
    val spend: Double,
    val revenue: Double,
    val ctr: Double,
    val cpm: Double,
    val cpc: Double,
    val cpa: Double,
    val roi: Double,
    val period: String
)
