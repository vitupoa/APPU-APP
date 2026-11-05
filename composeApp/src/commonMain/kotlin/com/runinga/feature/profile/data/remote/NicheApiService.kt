package com.runinga.feature.profile.data.remote

import com.runinga.com.core.network.NetworkResult
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

interface NicheApiService {
    suspend fun getAllNiches(): NetworkResult<List<NicheResponse>>
    suspend fun getMyNiches(): NetworkResult<UserNichesResponse>
    suspend fun updateMyNiches(request: UpdateNichesRequest): NetworkResult<UserNichesResponse>
    suspend fun addCustomNiche(request: AddCustomNicheRequest): NetworkResult<NicheResponse>
}

class NicheApiServiceImpl(
    private val client: HttpClient,
    private val baseUrl: String
) : NicheApiService {
    
    override suspend fun getAllNiches(): NetworkResult<List<NicheResponse>> {
        return try {
            val response = client.get("$baseUrl/niches")
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to fetch niches")
        }
    }
    
    override suspend fun getMyNiches(): NetworkResult<UserNichesResponse> {
        return try {
            val response = client.get("$baseUrl/niches/me")
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to fetch user niches")
        }
    }
    
    override suspend fun updateMyNiches(request: UpdateNichesRequest): NetworkResult<UserNichesResponse> {
        return try {
            val response = client.patch("$baseUrl/niches/me") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to update niches")
        }
    }
    
    override suspend fun addCustomNiche(request: AddCustomNicheRequest): NetworkResult<NicheResponse> {
        return try {
            val response = client.post("$baseUrl/niches/custom") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to add custom niche")
        }
    }
}

@Serializable
data class NicheResponse(
    val id: String,
    val name: String,
    val isCustom: Boolean,
    val usageCount: Int
)

@Serializable
data class UserNichesResponse(
    val selectedNiches: List<String>,
    val customNiches: List<String>
)

@Serializable
data class UpdateNichesRequest(
    val selectedNiches: List<String>,
    val customNiches: List<String>
)

@Serializable
data class AddCustomNicheRequest(
    val name: String
)
