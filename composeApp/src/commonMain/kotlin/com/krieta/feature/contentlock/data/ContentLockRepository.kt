package com.krieta.feature.contentlock.data

import com.krieta.com.core.network.NetworkResult

interface ContentLockRepository {
    suspend fun unlockContent(contentId: String, contentType: String): NetworkResult<UnlockResponse>
    suspend fun getUnlockPrice(unlockAmountKr: Int, currency: String): NetworkResult<UnlockPriceResponse>
    suspend fun convertFiatToKr(fiatAmount: Double, currency: String): NetworkResult<ConvertFiatResponse>
    suspend fun checkAccess(contentId: String, contentType: String): NetworkResult<AccessCheckResponse>
}

class ContentLockRepositoryImpl(
    private val api: ContentLockApi
) : ContentLockRepository {
    
    override suspend fun unlockContent(contentId: String, contentType: String): NetworkResult<UnlockResponse> {
        return try {
            NetworkResult.Success(api.unlockContent(contentId, contentType))
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to unlock content")
        }
    }
    
    override suspend fun getUnlockPrice(unlockAmountKr: Int, currency: String): NetworkResult<UnlockPriceResponse> {
        return try {
            NetworkResult.Success(api.getUnlockPrice(unlockAmountKr, currency))
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to get unlock price")
        }
    }
    
    override suspend fun convertFiatToKr(fiatAmount: Double, currency: String): NetworkResult<ConvertFiatResponse> {
        return try {
            NetworkResult.Success(api.convertFiatToKr(fiatAmount, currency))
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to convert currency")
        }
    }
    
    override suspend fun checkAccess(contentId: String, contentType: String): NetworkResult<AccessCheckResponse> {
        return try {
            NetworkResult.Success(api.checkAccess(contentId, contentType))
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to check access")
        }
    }
}
