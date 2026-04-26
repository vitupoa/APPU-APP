package com.krieta.feature.marketplace.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.marketplace.data.remote.*
import com.krieta.feature.marketplace.domain.model.*
import com.krieta.feature.marketplace.domain.repository.MarketplaceRepository

class MarketplaceRepositoryImpl(
    private val apiService: MarketplaceApiService
) : MarketplaceRepository {
    
    override suspend fun searchInfluencers(
        tier: InfluencerTier?,
        category: String?,
        minEngagement: Double?,
        minFollowers: Int?,
        minSubscribers: Int?,
        platform: String?
    ): NetworkResult<Pair<List<InfluencerProfile>, Map<String, List<SocialMediaAccount>>>> = try {
        val response = apiService.searchInfluencers(
            tier, category, minEngagement, minFollowers, minSubscribers, platform
        )
        NetworkResult.Success(response)
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to search influencers")
    }
    
    override suspend fun getInfluencerProfile(userId: String): NetworkResult<InfluencerProfile> = try {
        NetworkResult.Success(apiService.getInfluencerProfile(userId))
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to get profile")
    }
    
    override suspend fun createCampaign(
        title: String,
        description: String,
        budget: Double,
        targetTier: InfluencerTier?,
        categories: List<String>,
        requirements: String,
        deliverables: String,
        startDate: String,
        endDate: String
    ): NetworkResult<BrandCampaign> = try {
        NetworkResult.Success(apiService.createCampaign(
            CreateCampaignRequest(title, description, budget, targetTier, categories, requirements, deliverables, startDate, endDate)
        ))
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to create campaign")
    }
    
    override suspend fun getMyCampaigns(): NetworkResult<List<BrandCampaign>> = try {
        NetworkResult.Success(apiService.getMyCampaigns())
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to get campaigns")
    }
    
    override suspend fun getAvailableCampaigns(): NetworkResult<List<BrandCampaign>> = try {
        NetworkResult.Success(apiService.getAvailableCampaigns())
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to get available campaigns")
    }
    
    override suspend fun applyToCampaign(
        campaignId: String,
        proposedRate: Double,
        pitch: String
    ): NetworkResult<CampaignApplication> = try {
        NetworkResult.Success(apiService.applyToCampaign(ApplyCampaignRequest(campaignId, proposedRate, pitch)))
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to apply")
    }
    
    override suspend fun getMyApplications(): NetworkResult<List<CampaignApplication>> = try {
        NetworkResult.Success(apiService.getMyApplications())
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to get applications")
    }
    
    override suspend fun reviewApplication(
        applicationId: String,
        status: ApplicationStatus
    ): NetworkResult<CampaignApplication> = try {
        NetworkResult.Success(apiService.reviewApplication(applicationId, status))
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to review")
    }
    
    override suspend fun sponsorContest(
        contestId: String,
        amount: Double,
        productUrl: String?,
        enablePurchaseToEnter: Boolean
    ): NetworkResult<ContestSponsorship> = try {
        NetworkResult.Success(apiService.sponsorContest(
            SponsorContestRequest(contestId, amount, productUrl, enablePurchaseToEnter)
        ))
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to sponsor")
    }
    
    override suspend fun trackPurchase(
        contestId: String,
        productId: String,
        amount: Double
    ): NetworkResult<Unit> = try {
        apiService.trackPurchase(TrackPurchaseRequest(contestId, productId, amount))
        NetworkResult.Success(Unit)
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to track purchase")
    }
    
    override suspend fun createConversionCampaign(
        contestId: String,
        targetSegment: String,
        offerType: String,
        discountPercent: Int?,
        message: String,
        startDate: String,
        endDate: String
    ): NetworkResult<ConversionCampaign> = try {
        NetworkResult.Success(apiService.createConversionCampaign(
            CreateConversionRequest(contestId, targetSegment, offerType, discountPercent, message, startDate, endDate)
        ))
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to create conversion campaign")
    }
    
    override suspend fun getGamificationStats(): NetworkResult<GamificationStats> = try {
        NetworkResult.Success(apiService.getGamificationStats())
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to get stats")
    }
    
    override suspend fun getCampaignROI(campaignId: String): NetworkResult<ROIMetrics> = try {
        NetworkResult.Success(apiService.getCampaignROI(campaignId))
    } catch (e: Exception) {
        NetworkResult.Error(message = e.message ?: "Failed to get ROI")
    }
}
