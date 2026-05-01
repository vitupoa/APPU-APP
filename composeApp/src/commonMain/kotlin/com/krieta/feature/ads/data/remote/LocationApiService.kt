package com.krieta.feature.ads.data.remote

import com.krieta.com.core.network.NetworkResult
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import kotlinx.serialization.Serializable

interface LocationApiService {
    suspend fun getLocationHierarchy(parentId: String?): NetworkResult<List<LocationResponse>>
    suspend fun searchLocations(query: String, scope: String?): NetworkResult<List<LocationResponse>>
}

class LocationApiServiceImpl(
    private val client: HttpClient,
    private val baseUrl: String
) : LocationApiService {
    
    override suspend fun getLocationHierarchy(parentId: String?): NetworkResult<List<LocationResponse>> {
        return try {
            val response = client.get("$baseUrl/locations/hierarchy") {
                parentId?.let { parameter("parentId", it) }
            }
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to fetch location hierarchy")
        }
    }
    
    override suspend fun searchLocations(query: String, scope: String?): NetworkResult<List<LocationResponse>> {
        return try {
            val response = client.get("$baseUrl/locations/search") {
                parameter("query", query)
                scope?.let { parameter("scope", it) }
            }
            NetworkResult.Success(response.body())
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to search locations")
        }
    }
}

@Serializable
data class LocationResponse(
    val id: String,
    val scope: String,
    val scopeValue: String,
    val displayName: String,
    val parentId: String?,
    val continent: String?,
    val country: String?,
    val countryCode: String?,
    val region: String?,
    val city: String?,
    val latitude: Double?,
    val longitude: Double?
)
