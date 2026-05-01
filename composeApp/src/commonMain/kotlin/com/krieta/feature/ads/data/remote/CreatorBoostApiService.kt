package com.krieta.feature.ads.data.remote

import com.krieta.com.core.network.NetworkResult
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import kotlinx.serialization.Serializable

interface CreatorBoostApiService {
    suspend fun getBoostSettings(): NetworkResult<BoostSettingsResponse>
}

class CreatorBoostApiServiceImpl(
    private val client: HttpClient,
    private val baseUrl: String
) : CreatorBoostApiService {
    
    override suspend fun getBoostSettings(): NetworkResult<BoostSettingsResponse> {
        return try {
            val response = client.get("$baseUrl/creator-boost/settings")
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to fetch boost settings")
        }
    }
}

@Serializable
data class BoostSettingsResponse(
    val minBoostAmountKes: Double,
    val shortCpmKes: Double,
    val postCpmKes: Double,
    val liveCpmKes: Double
)
