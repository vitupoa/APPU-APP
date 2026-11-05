package com.runinga.feature.ads.data.remote

import com.runinga.com.core.network.NetworkResult
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

interface DisplayAdsApiService {
    suspend fun createCampaign(request: CreateCampaignRequest): NetworkResult<CampaignResponse>
    suspend fun getMyCampaigns(): NetworkResult<List<CampaignResponse>>
    suspend fun getCampaign(id: String): NetworkResult<CampaignResponse>
    suspend fun updateCampaign(id: String, request: UpdateCampaignRequest): NetworkResult<CampaignResponse>
}

class DisplayAdsApiServiceImpl(
    private val client: HttpClient,
    private val baseUrl: String
) : DisplayAdsApiService {
    
    override suspend fun createCampaign(request: CreateCampaignRequest): NetworkResult<CampaignResponse> {
        return try {
            val response = client.post("$baseUrl/display-ads/campaigns") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to create campaign")
        }
    }
    
    override suspend fun getMyCampaigns(): NetworkResult<List<CampaignResponse>> {
        return try {
            val response = client.get("$baseUrl/display-ads/campaigns")
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to fetch campaigns")
        }
    }
    
    override suspend fun getCampaign(id: String): NetworkResult<CampaignResponse> {
        return try {
            val response = client.get("$baseUrl/display-ads/campaigns/$id")
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to fetch campaign")
        }
    }
    
    override suspend fun updateCampaign(id: String, request: UpdateCampaignRequest): NetworkResult<CampaignResponse> {
        return try {
            val response = client.patch("$baseUrl/display-ads/campaigns/$id") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to update campaign")
        }
    }
}

@Serializable
data class CreateCampaignRequest(
    val campaignName: String,
    val campaignObjective: String,
    val adTitle: String,
    val adDescription: String?,
    val primaryImageUrl: String,
    val secondaryImageUrls: List<String>,
    val videoUrl: String?,
    val ctaText: String,
    val ctaUrl: String,
    val budgetType: String,
    val dailyBudgetKes: Double?,
    val lifetimeBudgetKes: Double?,
    val biddingStrategy: String,
    val targetCpm: Double?,
    val costCap: Double?,
    val targetAgeMin: Int?,
    val targetAgeMax: Int?,
    val targetGenders: List<String>,
    val targetLanguages: List<String>,
    val targetInterests: List<String>,
    val targetBehaviors: List<String>,
    val targetContentNiches: List<String>,
    val targetCreatorTiers: List<String>,
    val placements: List<String>,
    val chatNiches: List<String>,
    val locations: List<LocationTargeting>,
    val startDate: String,
    val endDate: String?
)

@Serializable
data class UpdateCampaignRequest(
    val status: String? = null,
    val dailyBudgetKes: Double? = null,
    val lifetimeBudgetKes: Double? = null
)

@Serializable
data class LocationTargeting(
    val scope: String,
    val scopeValue: String,
    val scopeDisplayName: String,
    val isExcluded: Boolean = false
)

@Serializable
data class CampaignResponse(
    val id: String,
    val campaignName: String,
    val status: String,
    val totalSpentKes: Double,
    val impressions: Int,
    val clicks: Int,
    val conversions: Int,
    val ctr: Double,
    val avgCpm: Double,
    val createdAt: String
)
