package com.krieta.feature.shop.data.remote

import com.krieta.core.network.ApiResponse
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

data class ListingFeeCalculation(
    val fee: Double,
    val isFree: Boolean,
    val quotaType: String?
)

data class UserListingQuota(
    val dailyUsed: Int,
    val weeklyUsed: Int,
    val monthlyUsed: Int,
    val dailyLimit: Int,
    val weeklyLimit: Int,
    val monthlyLimit: Int
)

class ListingFeeApi(private val client: HttpClient) {
    
    suspend fun calculateListingFee(category: String): ApiResponse<ListingFeeCalculation> {
        return try {
            val response = client.get("/shop/listing-fee/calculate") {
                parameter("category", category)
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Failed to calculate listing fee")
        }
    }
    
    suspend fun getUserQuota(): ApiResponse<UserListingQuota> {
        return try {
            val response = client.get("/shop/listing-fee/quota")
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Failed to get quota")
        }
    }
}
