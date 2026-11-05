package com.runinga.feature.contentlock.data

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

interface ContentLockApi {
    suspend fun unlockContent(contentId: String, contentType: String): UnlockResponse
    suspend fun getUnlockPrice(unlockAmountKr: Int, currency: String): UnlockPriceResponse
    suspend fun convertFiatToKr(fiatAmount: Double, currency: String): ConvertFiatResponse
    suspend fun checkAccess(contentId: String, contentType: String): AccessCheckResponse
}

class ContentLockApiImpl(private val client: HttpClient) : ContentLockApi {
    
    override suspend fun unlockContent(contentId: String, contentType: String): UnlockResponse {
        return client.post("/api/v1/content-lock/unlock") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("contentId" to contentId, "contentType" to contentType))
        }.body()
    }
    
    override suspend fun getUnlockPrice(unlockAmountKr: Int, currency: String): UnlockPriceResponse {
        return client.get("/api/v1/content-lock/price") {
            parameter("unlockAmountKr", unlockAmountKr)
            parameter("currency", currency)
        }.body()
    }
    
    override suspend fun convertFiatToKr(fiatAmount: Double, currency: String): ConvertFiatResponse {
        return client.post("/api/v1/content-lock/convert-fiat") {
            contentType(ContentType.Application.Json)
            setBody(mapOf("fiatAmount" to fiatAmount, "currency" to currency))
        }.body()
    }
    
    override suspend fun checkAccess(contentId: String, contentType: String): AccessCheckResponse {
        return client.get("/api/v1/content-lock/check-access") {
            parameter("contentId", contentId)
            parameter("contentType", contentType)
        }.body()
    }
}

@kotlinx.serialization.Serializable
data class UnlockResponse(
    val success: Boolean,
    val unlockAmountKr: Int,
    val creatorReceivedKr: Int,
    val platformFeeKr: Int
)

@kotlinx.serialization.Serializable
data class UnlockPriceResponse(
    val krAmount: Int,
    val fiatAmount: Double,
    val currency: String,
    val displayText: String
)

@kotlinx.serialization.Serializable
data class ConvertFiatResponse(
    val krAmount: Int,
    val fiatAmount: Double,
    val currency: String
)

@kotlinx.serialization.Serializable
data class AccessCheckResponse(
    val hasAccess: Boolean,
    val reason: String? = null,
    val requiresSubscription: Boolean? = null,
    val requiresUnlock: Boolean? = null,
    val unlockAmountKr: Int? = null
)
