package com.krieta.feature.admin.data.repository

import com.krieta.feature.admin.domain.model.*
import com.krieta.feature.admin.domain.repository.AdManagementRepository
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

class AdManagementRepositoryImpl(
    private val client: HttpClient,
    private val baseUrl: String
) : AdManagementRepository {

    // ==================== CONFIG ====================

    override suspend fun getAdConfig(): Result<AdConfig> = runCatching {
        client.get("$baseUrl/api/v1/admin/ads/config").body()
    }

    override suspend fun updatePlatformCut(percentage: Double): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/platform-cut") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("percentage" to percentage))
        }.body()
    }

    override suspend fun updateNativeAdPricing(minCpm: Double, maxCpm: Double): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/native-pricing") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("minCpm" to minCpm, "maxCpm" to maxCpm))
        }.body()
    }

    override suspend fun updateBannerAdPricing(minCpm: Double, maxCpm: Double): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/banner-pricing") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("minCpm" to minCpm, "maxCpm" to maxCpm))
        }.body()
    }

    override suspend fun updateStoryAdPricing(minCpm: Double, maxCpm: Double): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/story-pricing") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("minCpm" to minCpm, "maxCpm" to maxCpm))
        }.body()
    }

    override suspend fun updateNativeAdFrequency(frequency: Int): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/native-frequency") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("frequency" to frequency))
        }.body()
    }

    override suspend fun updateBannerAdFrequency(frequency: Int): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/banner-frequency") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("frequency" to frequency))
        }.body()
    }

    override suspend fun updateStoryAdFrequency(frequency: Int): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/story-frequency") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("frequency" to frequency))
        }.body()
    }

    override suspend fun toggleAds(enabled: Boolean): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/toggle-ads") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("enabled" to enabled))
        }.body()
    }

    override suspend fun toggleMaxAdLoad(enabled: Boolean): Result<AdConfig> = runCatching {
        client.put("$baseUrl/api/v1/admin/ads/config/toggle-max-load") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("enabled" to enabled))
        }.body()
    }

    // ==================== CAMPAIGNS ====================

    override suspend fun getCampaigns(
        status: AdStatus?,
        brandId: String?,
        adType: AdType?,
        page: Int,
        limit: Int
    ): Result<CampaignListResponse> = runCatching {
        client.get("$baseUrl/api/v1/admin/ads/campaigns") {
            parameter("status", status?.name)
            parameter("brandId", brandId)
            parameter("adType", adType?.name)
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    override suspend fun getCampaignById(campaignId: String): Result<AdCampaign> = runCatching {
        client.get("$baseUrl/api/v1/admin/ads/campaigns/$campaignId").body()
    }

    override suspend fun approveCampaign(campaignId: String): Result<AdCampaign> = runCatching {
        client.post("$baseUrl/api/v1/admin/ads/campaigns/$campaignId/approve").body()
    }

    override suspend fun rejectCampaign(campaignId: String, reason: String): Result<AdCampaign> = runCatching {
        client.post("$baseUrl/api/v1/admin/ads/campaigns/$campaignId/reject") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("reason" to reason))
        }.body()
    }

    override suspend fun pauseCampaign(campaignId: String): Result<AdCampaign> = runCatching {
        client.post("$baseUrl/api/v1/admin/ads/campaigns/$campaignId/pause").body()
    }

    override suspend fun deleteCampaign(campaignId: String): Result<Unit> = runCatching {
        client.delete("$baseUrl/api/v1/admin/ads/campaigns/$campaignId")
    }

    // ==================== SPONSORED POSTS ====================

    override suspend fun getSponsoredPosts(
        status: SponsoredPostStatus?,
        brandId: String?,
        creatorId: String?,
        page: Int,
        limit: Int
    ): Result<SponsoredPostListResponse> = runCatching {
        client.get("$baseUrl/api/v1/admin/ads/sponsored-posts") {
            parameter("status", status?.name)
            parameter("brandId", brandId)
            parameter("creatorId", creatorId)
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    override suspend fun getSponsoredPostById(postId: String): Result<SponsoredPostRequest> = runCatching {
        client.get("$baseUrl/api/v1/admin/ads/sponsored-posts/$postId").body()
    }

    override suspend fun verifySponsoredPost(postId: String): Result<SponsoredPostRequest> = runCatching {
        client.post("$baseUrl/api/v1/admin/ads/sponsored-posts/$postId/verify").body()
    }

    override suspend fun releasePayment(postId: String): Result<SponsoredPostRequest> = runCatching {
        client.post("$baseUrl/api/v1/admin/ads/sponsored-posts/$postId/release-payment").body()
    }

    // ==================== ANALYTICS ====================

    override suspend fun getAnalytics(startDate: String, endDate: String): Result<AnalyticsResponse> = runCatching {
        client.get("$baseUrl/api/v1/admin/ads/analytics") {
            parameter("startDate", startDate)
            parameter("endDate", endDate)
        }.body()
    }

    override suspend fun getPlatformStats(): Result<PlatformStats> = runCatching {
        client.get("$baseUrl/api/v1/admin/ads/stats").body()
    }
}

// Response models
data class CampaignListResponse(
    val campaigns: List<AdCampaign>,
    val total: Int,
    val page: Int,
    val limit: Int
)

data class SponsoredPostListResponse(
    val posts: List<SponsoredPostRequest>,
    val total: Int,
    val page: Int,
    val limit: Int
)

data class AnalyticsResponse(
    val analytics: List<AdAnalytics>,
    val totals: AnalyticsTotals
)

data class AnalyticsTotals(
    val totalAdSpend: Double,
    val platformRevenue: Double,
    val creatorRevenue: Double,
    val totalImpressions: Int,
    val totalClicks: Int,
    val totalConversions: Int
)

data class PlatformStats(
    val config: AdConfig,
    val campaigns: CampaignStats,
    val sponsoredPosts: SponsoredPostStats
)

data class CampaignStats(
    val pendingCampaigns: Int,
    val activeCampaigns: Int,
    val completedCampaigns: Int,
    val totalSpent: Double
)

data class SponsoredPostStats(
    val pendingPosts: Int,
    val submittedPosts: Int,
    val approvedPosts: Int,
    val totalPayments: Double
)
