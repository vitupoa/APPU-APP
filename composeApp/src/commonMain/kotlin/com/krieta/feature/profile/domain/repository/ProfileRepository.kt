package com.krieta.feature.profile.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.*
import kotlinx.coroutines.flow.SharedFlow

data class SocialListResult(val items: List<SocialUser>, val nextCursor: String?)

interface ProfileRepository {
    val profileUpdates: SharedFlow<UserProfile>
    suspend fun getMyProfile(): NetworkResult<UserProfile>
    suspend fun getProfile(userId: String): NetworkResult<UserProfile>
    suspend fun updateProfile(
        firstName: String?, lastName: String?,
        username: String?, bio: String?, avatarUrl: String?, coverPhotoUrl: String?,
        selectedNiches: List<String>? = null, customNiches: List<String>? = null
    ): NetworkResult<UserProfile>
    suspend fun searchUsers(query: String): NetworkResult<List<SocialUser>>
    suspend fun updateBioLinks(links: List<BioLink>): NetworkResult<List<BioLink>>

    suspend fun admire(userId: String): NetworkResult<Boolean> // returns isLovers
    suspend fun unadmire(userId: String): NetworkResult<Unit>
    suspend fun getAdmirers(userId: String, cursor: String?): NetworkResult<SocialListResult>
    suspend fun getAdmiring(userId: String, cursor: String?): NetworkResult<SocialListResult>
    suspend fun getLovers(userId: String, cursor: String?): NetworkResult<SocialListResult>

    suspend fun getMyMilestones(): NetworkResult<List<Milestone>>

    suspend fun getMySubscriptionTiers(): NetworkResult<List<SubscriptionTier>>
    suspend fun updateSubscriptionTiers(tiers: List<SubscriptionTier>): NetworkResult<List<SubscriptionTier>>
    suspend fun getUserSubscriptionTiers(userId: String): NetworkResult<List<SubscriptionTier>>
    suspend fun subscribe(userId: String, tier: String): NetworkResult<Unit>
    suspend fun unsubscribe(userId: String): NetworkResult<Unit>
}
