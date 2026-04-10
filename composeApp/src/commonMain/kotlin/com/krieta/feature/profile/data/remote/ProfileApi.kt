package com.krieta.feature.profile.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.profile.data.remote.dto.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.*
import io.ktor.http.ContentType
import io.ktor.http.contentType

class ProfileApi(private val httpClient: HttpClient) {

    // ─── PROFILE ──────────────────────────────────
    suspend fun getMyProfile(): UserProfileDto {
        return httpClient.get(ApiConstants.USERS_ME).body()
    }

    suspend fun getProfile(userId: String): UserProfileDto {
        return httpClient.get("${ApiConstants.USERS}/$userId").body()
    }

    suspend fun updateProfile(request: UpdateProfileRequestDto): UserProfileDto {
        return httpClient.put(ApiConstants.USERS_ME) {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }

    suspend fun updateBioLinks(links: List<BioLinkRequestDto>): List<BioLinkDto> {
        return httpClient.put("${ApiConstants.USERS_ME}/bio-links") {
            contentType(ContentType.Application.Json)
            setBody(links)
        }.body()
    }

    // ─── ADMIRE / LOVER ───────────────────────────
    suspend fun admire(userId: String): AdmireResponseDto {
        return httpClient.post("${ApiConstants.USERS}/$userId/admire").body()
    }

    suspend fun unadmire(userId: String): AdmireResponseDto {
        return httpClient.delete("${ApiConstants.USERS}/$userId/admire").body()
    }

    suspend fun getAdmirers(userId: String, cursor: String? = null): SocialListResponseDto {
        return httpClient.get("${ApiConstants.USERS}/$userId/admirers") {
            cursor?.let { parameter("cursor", it) }
        }.body()
    }

    suspend fun getAdmiring(userId: String, cursor: String? = null): SocialListResponseDto {
        return httpClient.get("${ApiConstants.USERS}/$userId/admiring") {
            cursor?.let { parameter("cursor", it) }
        }.body()
    }

    suspend fun getLovers(userId: String, cursor: String? = null): SocialListResponseDto {
        return httpClient.get("${ApiConstants.USERS}/$userId/lovers") {
            cursor?.let { parameter("cursor", it) }
        }.body()
    }

    // ─── MILESTONES ───────────────────────────────
    suspend fun getMyMilestones(): List<MilestoneDto> {
        return httpClient.get(ApiConstants.USERS_ME_MILESTONES).body()
    }

    // ─── SUBSCRIPTION TIERS ──────────────────────
    suspend fun getMySubscriptionTiers(): List<SubscriptionTierDto> {
        return httpClient.get(ApiConstants.USERS_ME_SUBSCRIPTION_TIERS).body()
    }

    suspend fun updateSubscriptionTiers(tiers: List<UpdateTierRequestDto>): List<SubscriptionTierDto> {
        return httpClient.put(ApiConstants.USERS_ME_SUBSCRIPTION_TIERS) {
            contentType(ContentType.Application.Json)
            setBody(tiers)
        }.body()
    }

    suspend fun getUserSubscriptionTiers(userId: String): List<SubscriptionTierDto> {
        return httpClient.get("${ApiConstants.USERS}/$userId/subscription-tiers").body()
    }

    suspend fun subscribe(userId: String, tier: String) {
        httpClient.post("${ApiConstants.USERS}/$userId/subscribe") {
            contentType(ContentType.Application.Json)
            setBody(SubscribeRequestDto(tier))
        }
    }

    suspend fun unsubscribe(userId: String) {
        httpClient.delete("${ApiConstants.USERS}/$userId/subscribe")
    }
}
