package com.krieta.feature.profile.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.profile.data.remote.ProfileApi
import com.krieta.feature.profile.data.remote.dto.*
import com.krieta.feature.profile.domain.model.*
import com.krieta.feature.profile.domain.repository.ProfileRepository
import com.krieta.feature.profile.domain.repository.SocialListResult

class ProfileRepositoryImpl(
    private val api: ProfileApi
) : ProfileRepository {

    override suspend fun getMyProfile(): NetworkResult<UserProfile> =
        safeApiCall { api.getMyProfile().toDomain() }

    override suspend fun getProfile(userId: String): NetworkResult<UserProfile> =
        safeApiCall { api.getProfile(userId).toDomain() }

    override suspend fun updateProfile(
        firstName: String?, lastName: String?, displayName: String?,
        username: String?, bio: String?, avatarUrl: String?, coverPhotoUrl: String?
    ): NetworkResult<UserProfile> = safeApiCall {
        api.updateProfile(
            UpdateProfileRequestDto(firstName, lastName, displayName, username, bio, avatarUrl, coverPhotoUrl)
        ).toDomain()
    }

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

    private fun UserProfileDto.toDomain() = UserProfile(
        id = id,
        username = username,
        firstName = firstName,
        lastName = lastName,
        displayName = displayName,
        avatarUrl = avatarUrl,
        coverPhotoUrl = coverPhotoUrl,
        bio = bio,
        country = country,
        currency = currency,
        accountType = parseAccountType(accountType),
        isVerified = isVerified,
        isWalletUnlocked = isWalletUnlocked,
        bioLinks = bioLinks.map { it.toBioLink() },
        stats = ProfileStats(stats.admirers, stats.admiring, stats.lovers, stats.contestsWon),
        relationshipStatus = parseRelationship(relationshipStatus),
        createdAt = createdAt
    )

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
