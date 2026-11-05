package com.runinga.feature.sponsored.domain.model

import kotlinx.serialization.Serializable

@Serializable
enum class SponsoredContentType {
    SHORT, POST, STORY
}

@Serializable
enum class SponsoredContentStatus {
    DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ACTIVE, PAUSED, COMPLETED
}

@Serializable
enum class PricingModel {
    CPM,      // Cost per 1000 impressions
    CPV,      // Cost per view (3+ seconds)
    CPE,      // Cost per engagement
    CPC,      // Cost per click
    FLAT_FEE  // Fixed campaign cost
}

@Serializable
data class SponsoredContent(
    val id: String,
    val brandUserId: String,
    val contentType: SponsoredContentType,
    val contentId: String,
    val campaignName: String,
    val budget: Double,
    val spent: Double,
    val pricingModel: PricingModel,
    val bidAmount: Double,
    val startDate: String,
    val endDate: String,
    val targeting: SponsoredTargeting? = null,
    val status: SponsoredContentStatus,
    val impressions: Int = 0,
    val views: Int = 0,
    val engagements: Int = 0,
    val clicks: Int = 0,
    val createdAt: String
)

@Serializable
data class SponsoredTargeting(
    val ageMin: Int? = null,
    val ageMax: Int? = null,
    val gender: List<String>? = null,
    val countries: List<String>? = null,
    val cities: List<String>? = null,
    val interests: List<String>? = null,
    val minFollowers: Int? = null
)

@Serializable
data class CreateSponsoredCampaignRequest(
    val contentType: SponsoredContentType,
    val contentId: String,
    val campaignName: String,
    val budget: Double,
    val pricingModel: PricingModel,
    val bidAmount: Double,
    val startDate: String,
    val endDate: String,
    val targeting: SponsoredTargeting? = null
)

@Serializable
data class SponsoredAnalytics(
    val campaignName: String,
    val status: SponsoredContentStatus,
    val budget: Double,
    val spent: Double,
    val impressions: Int,
    val views: Int,
    val engagements: Int,
    val clicks: Int,
    val cpm: Double,
    val ctr: Double,
    val engagementRate: Double
)
