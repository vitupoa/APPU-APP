package com.krieta.feature.shop.data.remote

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
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
    
    suspend fun calculateListingFee(category: String): NetworkResult<ListingFeeCalculation> {
        return safeApiCall {
            client.get("/shop/listing-fee/calculate") {
                parameter("category", category)
            }.body()
        }
    }
    
    suspend fun getUserQuota(): NetworkResult<UserListingQuota> {
        return safeApiCall {
            client.get("/shop/listing-fee/quota").body()
        }
    }
}
