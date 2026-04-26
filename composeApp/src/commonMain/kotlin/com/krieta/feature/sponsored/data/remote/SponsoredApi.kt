package com.krieta.feature.sponsored.data.remote

import com.krieta.feature.sponsored.domain.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

class SponsoredApi(private val client: HttpClient) {
    
    suspend fun createCampaign(request: CreateSponsoredCampaignRequest): SponsoredContent {
        return client.post("/api/v1/sponsored/campaigns") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }
    
    suspend fun getSponsoredContentForFeed(contentType: String = "short"): SponsoredContent? {
        return client.get("/api/v1/sponsored/feed") {
            parameter("contentType", contentType)
        }.body()
    }
    
    suspend fun recordImpression(campaignId: String) {
        client.post("/api/v1/sponsored/impression") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("campaignId" to campaignId))
        }
    }
    
    suspend fun recordView(campaignId: String, watchTimeSeconds: Int) {
        client.post("/api/v1/sponsored/view") {
            contentType(ContentType.Application.Json)
            setBody(mapOf(
                "campaignId" to campaignId,
                "watchTimeSeconds" to watchTimeSeconds
            ))
        }
    }
    
    suspend fun recordEngagement(campaignId: String, type: String) {
        client.post("/api/v1/sponsored/engagement") {
            contentType(ContentType.Application.Json)
            setBody(mapOf(
                "campaignId" to campaignId,
                "type" to type
            ))
        }
    }
    
    suspend fun getCampaignAnalytics(campaignId: String): SponsoredAnalytics {
        return client.get("/api/v1/sponsored/campaigns/$campaignId/analytics").body()
    }
    
    suspend fun toggleCampaign(campaignId: String): SponsoredContent {
        return client.patch("/api/v1/sponsored/campaigns/$campaignId/toggle").body()
    }
    
    suspend fun getMyCampaigns(): List<SponsoredContent> {
        return client.get("/api/v1/sponsored/campaigns/my").body()
    }
    
    suspend fun getPendingCampaigns(): List<SponsoredContent> {
        return client.get("/api/v1/sponsored/campaigns/pending").body()
    }
    
    suspend fun approveCampaign(campaignId: String): SponsoredContent {
        return client.patch("/api/v1/sponsored/campaigns/$campaignId/approve").body()
    }
    
    suspend fun rejectCampaign(campaignId: String): SponsoredContent {
        return client.patch("/api/v1/sponsored/campaigns/$campaignId/reject").body()
    }
}
