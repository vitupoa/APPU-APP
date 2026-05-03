package com.krieta.feature.contentlock.data

import com.krieta.core.network.Result

interface ContentLockRepository {
    suspend fun unlockContent(contentId: String, contentType: String): Result<UnlockResponse>
    suspend fun getUnlockPrice(unlockAmountKr: Int, currency: String): Result<UnlockPriceResponse>
    suspend fun convertFiatToKr(fiatAmount: Double, currency: String): Result<ConvertFiatResponse>
    suspend fun checkAccess(contentId: String, contentType: String): Result<AccessCheckResponse>
}

class ContentLockRepositoryImpl(
    private val api: ContentLockApi
) : ContentLockRepository {
    
    override suspend fun unlockContent(contentId: String, contentType: String): Result<UnlockResponse> {
        return try {
            Result.Success(api.unlockContent(contentId, contentType))
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to unlock content")
        }
    }
    
    override suspend fun getUnlockPrice(unlockAmountKr: Int, currency: String): Result<UnlockPriceResponse> {
        return try {
            Result.Success(api.getUnlockPrice(unlockAmountKr, currency))
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to get unlock price")
        }
    }
    
    override suspend fun convertFiatToKr(fiatAmount: Double, currency: String): Result<ConvertFiatResponse> {
        return try {
            Result.Success(api.convertFiatToKr(fiatAmount, currency))
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to convert currency")
        }
    }
    
    override suspend fun checkAccess(contentId: String, contentType: String): Result<AccessCheckResponse> {
        return try {
            Result.Success(api.checkAccess(contentId, contentType))
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to check access")
        }
    }
}
