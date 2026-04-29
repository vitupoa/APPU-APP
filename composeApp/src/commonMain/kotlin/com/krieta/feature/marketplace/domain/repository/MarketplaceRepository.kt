package com.krieta.feature.marketplace.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.marketplace.data.remote.ConnectedAccountsResponse
import com.krieta.feature.marketplace.data.remote.OAuthUrlResponse
import com.krieta.feature.marketplace.domain.model.*

interface MarketplaceRepository {
    suspend fun searchInfluencers(
        tier: InfluencerTier?,
        category: String?,
        minEngagement: Double?,
        minFollowers: Int?,
        minSubscribers: Int?,
        platform: String?
    ): NetworkResult<Pair<List<InfluencerProfile>, Map<String, List<SocialMediaAccount>>>>
    
    suspend fun getInfluencerProfile(userId: String): NetworkResult<InfluencerProfile>
    
    suspend fun createCampaign(
        title: String,
        description: String,
        budget: Double,
        targetTier: InfluencerTier?,
        categories: List<String>,
        requirements: String,
        deliverables: String,
        startDate: String,
        endDate: String
    ): NetworkResult<BrandCampaign>
    
    suspend fun getMyCampaigns(): NetworkResult<List<BrandCampaign>>
    
    suspend fun getAvailableCampaigns(): NetworkResult<List<BrandCampaign>>
    
    suspend fun applyToCampaign(
        campaignId: String,
        proposedRate: Double,
        pitch: String
    ): NetworkResult<CampaignApplication>
    
    suspend fun getMyApplications(): NetworkResult<List<CampaignApplication>>
    
    suspend fun reviewApplication(
        applicationId: String,
        status: ApplicationStatus
    ): NetworkResult<CampaignApplication>
    
    suspend fun sponsorContest(
        contestId: String,
        amount: Double,
        productUrl: String?,
        enablePurchaseToEnter: Boolean
    ): NetworkResult<ContestSponsorship>
    
    suspend fun trackPurchase(
        contestId: String,
        productId: String,
        amount: Double
    ): NetworkResult<Unit>
    
    suspend fun createConversionCampaign(
        contestId: String,
        targetSegment: String,
        offerType: String,
        discountPercent: Int?,
        message: String,
        startDate: String,
        endDate: String
    ): NetworkResult<ConversionCampaign>
    
    suspend fun getGamificationStats(): NetworkResult<GamificationStats>
    
    suspend fun getCampaignROI(campaignId: String): NetworkResult<ROIMetrics>
    
    suspend fun getOAuthUrl(platform: String): NetworkResult<OAuthUrlResponse>
    suspend fun handleOAuthCallback(platform: String, code: String, state: String): NetworkResult<Unit>
    suspend fun getConnectedAccounts(): NetworkResult<ConnectedAccountsResponse>
    suspend fun disconnectAccount(platform: String): NetworkResult<Unit>
}
