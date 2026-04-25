package com.krieta.feature.marketplace.data.remote

import com.krieta.feature.marketplace.domain.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

class MarketplaceApiService(private val client: HttpClient) {
    
    suspend fun searchInfluencers(
        tier: InfluencerTier?,
        category: String?,
        minEngagement: Double?,
        minFollowers: Int?,
        minSubscribers: Int?,
        platform: String?
    ): Pair<List<InfluencerProfile>, Map<String, List<SocialMediaAccount>>> {
        return client.get("/api/v1/marketplace/influencers/search") {
            parameter("tier", tier?.name)
            parameter("category", category)
            parameter("minEngagement", minEngagement)
            parameter("minFollowers", minFollowers)
            parameter("minSubscribers", minSubscribers)
            parameter("platform", platform)
        }.body()
    }
    
    suspend fun getInfluencerProfile(userId: String): InfluencerProfile {
        return client.get("/api/v1/marketplace/influencers/$userId").body()
    }
    
    suspend fun createCampaign(request: CreateCampaignRequest): BrandCampaign {
        return client.post("/api/v1/marketplace/campaigns") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }
    
    suspend fun getMyCampaigns(): List<BrandCampaign> {
        return client.get("/api/v1/marketplace/campaigns/my-campaigns").body()
    }
    
    suspend fun getAvailableCampaigns(): List<BrandCampaign> {
        return client.get("/api/v1/marketplace/campaigns/available").body()
    }
    
    suspend fun applyToCampaign(request: ApplyCampaignRequest): CampaignApplication {
        return client.post("/api/v1/marketplace/campaigns/${request.campaignId}/apply") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }
    
    suspend fun getMyApplications(): List<CampaignApplication> {
        return client.get("/api/v1/marketplace/applications/my-applications").body()
    }
    
    suspend fun reviewApplication(applicationId: String, status: ApplicationStatus): CampaignApplication {
        return client.patch("/api/v1/marketplace/applications/$applicationId/review") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("status" to status.name))
        }.body()
    }
    
    suspend fun sponsorContest(request: SponsorContestRequest): ContestSponsorship {
        return client.post("/api/v1/marketplace/sponsorships") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }
    
    suspend fun trackPurchase(request: TrackPurchaseRequest) {
        client.post("/api/v1/marketplace/sales-funnel/purchase") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
    }
    
    suspend fun createConversionCampaign(request: CreateConversionRequest): ConversionCampaign {
        return client.post("/api/v1/marketplace/sales-funnel/conversion-campaigns") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }
    
    suspend fun getGamificationStats(): GamificationStats {
        return client.get("/api/v1/marketplace/gamification/stats").body()
    }
    
    suspend fun getCampaignROI(campaignId: String): ROIMetrics {
        return client.get("/api/v1/marketplace/sales-funnel/roi/$campaignId").body()
    }
}

@kotlinx.serialization.Serializable
data class CreateCampaignRequest(
    val title: String,
    val description: String,
    val budget: Double,
    val targetTier: InfluencerTier?,
    val categories: List<String>,
    val requirements: String,
    val deliverables: String,
    val startDate: String,
    val endDate: String
)

@kotlinx.serialization.Serializable
data class ApplyCampaignRequest(
    val campaignId: String,
    val proposedRate: Double,
    val pitch: String
)

@kotlinx.serialization.Serializable
data class SponsorContestRequest(
    val contestId: String,
    val sponsorshipAmount: Double,
    val productUrl: String?,
    val purchaseToEnterEnabled: Boolean
)

@kotlinx.serialization.Serializable
data class TrackPurchaseRequest(
    val contestId: String,
    val productId: String,
    val amount: Double
)

@kotlinx.serialization.Serializable
data class CreateConversionRequest(
    val contestId: String,
    val targetSegment: String,
    val offerType: String,
    val discountPercent: Int?,
    val message: String,
    val startDate: String,
    val endDate: String
)
