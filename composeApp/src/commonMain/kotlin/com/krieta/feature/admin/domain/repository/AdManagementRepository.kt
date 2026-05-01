package com.krieta.feature.admin.domain.repository

import com.krieta.feature.admin.domain.model.*
import com.krieta.feature.admin.data.repository.*

interface AdManagementRepository {
    
    // Config Management
    suspend fun getAdConfig(): Result<AdConfig>
    suspend fun updatePlatformCut(percentage: Double): Result<AdConfig>
    suspend fun updateNativeAdPricing(minCpm: Double, maxCpm: Double): Result<AdConfig>
    suspend fun updateBannerAdPricing(minCpm: Double, maxCpm: Double): Result<AdConfig>
    suspend fun updateStoryAdPricing(minCpm: Double, maxCpm: Double): Result<AdConfig>
    suspend fun updateNativeAdFrequency(frequency: Int): Result<AdConfig>
    suspend fun updateBannerAdFrequency(frequency: Int): Result<AdConfig>
    suspend fun updateStoryAdFrequency(frequency: Int): Result<AdConfig>
    suspend fun toggleAds(enabled: Boolean): Result<AdConfig>
    suspend fun toggleMaxAdLoad(enabled: Boolean): Result<AdConfig>
    
    // Campaign Management
    suspend fun getCampaigns(status: AdStatus? = null, brandId: String? = null, adType: AdType? = null, page: Int = 1, limit: Int = 20): Result<CampaignListResponse>
    suspend fun getCampaignById(campaignId: String): Result<AdCampaign>
    suspend fun approveCampaign(campaignId: String): Result<AdCampaign>
    suspend fun rejectCampaign(campaignId: String, reason: String): Result<AdCampaign>
    suspend fun pauseCampaign(campaignId: String): Result<AdCampaign>
    suspend fun deleteCampaign(campaignId: String): Result<Unit>
    
    // Sponsored Posts Management
    suspend fun getSponsoredPosts(status: SponsoredPostStatus? = null, brandId: String? = null, creatorId: String? = null, page: Int = 1, limit: Int = 20): Result<SponsoredPostListResponse>
    suspend fun getSponsoredPostById(postId: String): Result<SponsoredPostRequest>
    suspend fun verifySponsoredPost(postId: String): Result<SponsoredPostRequest>
    suspend fun releasePayment(postId: String): Result<SponsoredPostRequest>
    
    // Analytics
    suspend fun getAnalytics(startDate: String, endDate: String): Result<AnalyticsResponse>
    suspend fun getPlatformStats(): Result<PlatformStats>
}
