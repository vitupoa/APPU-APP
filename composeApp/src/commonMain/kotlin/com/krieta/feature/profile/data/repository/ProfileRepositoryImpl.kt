package com.krieta.feature.profile.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.profile.data.local.ProfileLocalDataSource
import com.krieta.feature.profile.data.remote.ProfileApi
import com.krieta.feature.profile.data.remote.dto.*
import com.krieta.feature.profile.domain.model.*
import com.krieta.feature.profile.domain.repository.ProfileRepository
import com.krieta.feature.profile.domain.repository.SocialListResult
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class ProfileRepositoryImpl(
    private val api: ProfileApi,
    private val localDataSource: ProfileLocalDataSource
) : ProfileRepository {

    private val _profileUpdates = MutableSharedFlow<UserProfile>(extraBufferCapacity = 1)
    override val profileUpdates: SharedFlow<UserProfile> = _profileUpdates.asSharedFlow()

    override suspend fun getMyProfile(): NetworkResult<UserProfile> {
        val cachedProfile = localDataSource.getCachedMyProfile()
        
        return when (val result = safeApiCall { api.getMyProfile() }) {
            is NetworkResult.Success -> {
                val profile = result.data.toDomain()
                localDataSource.cacheProfile(profile)
                NetworkResult.Success(profile)
            }
            is NetworkResult.Error -> {
                if (cachedProfile != null) {
                    println("✅ ProfileRepositoryImpl: Using cached profile (offline mode)")
                    NetworkResult.Success(cachedProfile)
                } else {
                    result
                }
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun getProfile(userId: String): NetworkResult<UserProfile> {
        val cachedProfile = localDataSource.getCachedProfile(userId)
        
        return when (val result = safeApiCall { api.getProfile(userId) }) {
            is NetworkResult.Success -> {
                val profile = result.data.toDomain()
                localDataSource.cacheProfile(profile)
                NetworkResult.Success(profile)
            }
            is NetworkResult.Error -> {
                if (cachedProfile != null) {
                    println("✅ ProfileRepositoryImpl: Using cached profile (offline mode)")
                    NetworkResult.Success(cachedProfile)
                } else {
                    result
                }
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun updateProfile(
        firstName: String?, lastName: String?, displayName: String?,
        username: String?, bio: String?, avatarUrl: String?, coverPhotoUrl: String?
    ): NetworkResult<UserProfile> = safeApiCall {
        val updated = api.updateProfile(
            UpdateProfileRequestDto(firstName, lastName, displayName, username, bio, avatarUrl, coverPhotoUrl)
        ).toDomain()
        _profileUpdates.tryEmit(updated)
        updated
    }

    override suspend fun searchUsers(query: String): NetworkResult<List<SocialUser>> = safeApiCall {
        api.searchUsers(query).map { it.toDomain() }
    }

    private fun SocialUserDto.toDomain() = SocialUser(id, username, displayName, avatarUrl, isVerified, isLovers)

    override suspend fun updateBioLinks(links: List<BioLink>): NetworkResult<List<BioLink>> =
        safeApiCall {
            api.updateBioLinks(links.map { BioLinkRequestDto(it.label, it.url, it.icon) })
                .map { it.toBioLink() }
        }

    override suspend fun admire(userId: String): NetworkResult<Boolean> =
        safeApiCall { api.admire(userId).isLovers }

    override suspend fun unadmire(userId: String): NetworkResult<Unit> =
        safeApiCall { api.unadmire(userId); Unit }

    override suspend fun getAdmirers(userId: String, cursor: String?): NetworkResult<SocialListResult> =
        safeApiCall { api.getAdmirers(userId, cursor).toSocialList() }

    override suspend fun getAdmiring(userId: String, cursor: String?): NetworkResult<SocialListResult> =
        safeApiCall { api.getAdmiring(userId, cursor).toSocialList() }

    override suspend fun getLovers(userId: String, cursor: String?): NetworkResult<SocialListResult> =
        safeApiCall { api.getLovers(userId, cursor).toSocialList() }

    override suspend fun getMyMilestones(): NetworkResult<List<Milestone>> =
        safeApiCall { api.getMyMilestones().map { it.toDomain() } }

    override suspend fun getMySubscriptionTiers(): NetworkResult<List<SubscriptionTier>> =
        safeApiCall { api.getMySubscriptionTiers().map { it.toDomain() } }

    override suspend fun updateSubscriptionTiers(tiers: List<SubscriptionTier>): NetworkResult<List<SubscriptionTier>> =
        safeApiCall {
            api.updateSubscriptionTiers(tiers.map {
                UpdateTierRequestDto(it.tier.name, it.krAmount, it.benefits, it.isEnabled)
            }).map { it.toDomain() }
        }

    override suspend fun getUserSubscriptionTiers(userId: String): NetworkResult<List<SubscriptionTier>> =
        safeApiCall { api.getUserSubscriptionTiers(userId).map { it.toDomain() } }

    override suspend fun subscribe(userId: String, tier: String): NetworkResult<Unit> =
        safeApiCall { api.subscribe(userId, tier) }

    override suspend fun unsubscribe(userId: String): NetworkResult<Unit> =
        safeApiCall { api.unsubscribe(userId) }

    // ─── MAPPERS ──────────────────────────────────

    private fun UserProfileDto.toDomain(): UserProfile {
        return UserProfile(
            id = id ?: "",
            username = username ?: "user",
            firstName = firstName ?: "",
            lastName = lastName ?: "",
            displayName = displayName ?: username ?: "User",
            avatarUrl = avatarUrl,
            coverPhotoUrl = coverPhotoUrl,
            bio = bio,
            country = country ?: "US",
            currency = currency ?: "USD",
            accountType = parseAccountType(accountType ?: "CREATOR"),
            isVerified = isVerified,
            isWalletUnlocked = isWalletUnlocked,
            bioLinks = bioLinks.map { it.toBioLink() },
            stats = ProfileStats(stats.admirers, stats.admiring, stats.lovers, stats.contestsWon),
            relationshipStatus = parseRelationship(relationshipStatus),
            selectedNiches = selectedNiches,
            customNiches = customNiches,
            createdAt = createdAt ?: ""
        )
    }

    private fun BioLinkDto.toBioLink() = BioLink(id, label, url, icon, sortOrder)

    private fun SocialListResponseDto.toSocialList() = SocialListResult(
        items = items.map { SocialUser(it.id, it.username, it.displayName, it.avatarUrl, it.isVerified, it.isLovers) },
        nextCursor = nextCursor
    )

    private fun MilestoneDto.toDomain() = Milestone(
        id = id,
        title = title,
        description = description,
        requirementType = requirementType,
        requirementValue = requirementValue,
        rewardKr = rewardKr,
        isCompleted = isCompleted,
        completedByUsername = completedBy?.username
    )

    private fun SubscriptionTierDto.toDomain() = SubscriptionTier(
        id = id,
        tier = parseTierType(tier),
        krAmount = krAmount,
        benefits = benefits,
        isEnabled = isEnabled
    )

    private fun parseAccountType(v: String) = try { AccountType.valueOf(v) } catch (_: Exception) { AccountType.CREATOR }
    private fun parseRelationship(v: String) = try { RelationshipStatus.valueOf(v) } catch (_: Exception) { RelationshipStatus.NONE }
    private fun parseTierType(v: String) = try { SubscriptionTierType.valueOf(v) } catch (_: Exception) { SubscriptionTierType.TOP_FUN }
}
