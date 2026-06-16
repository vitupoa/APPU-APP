package com.krieta.feature.profile.data.local

import com.krieta.db.KrietaDatabase
import com.krieta.feature.profile.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class ProfileLocalDataSource(private val database: KrietaDatabase) {
    
    private val queries = database.profileQueries
    
    suspend fun cacheProfile(profile: UserProfile) = withContext(Dispatchers.IO) {
        queries.insertOrReplaceProfile(
            id = profile.id,
            username = profile.username,
            firstName = profile.firstName,
            lastName = profile.lastName,
            displayName = profile.displayName,
            avatarUrl = profile.avatarUrl,
            coverPhotoUrl = profile.coverPhotoUrl,
            bio = profile.bio,
            country = profile.country,
            currency = profile.currency,
            accountType = profile.accountType.name,
            isVerified = if (profile.isVerified) 1L else 0L,
            isWalletUnlocked = if (profile.isWalletUnlocked) 1L else 0L,
            admirers = profile.stats.admirers.toLong(),
            admiring = profile.stats.admiring.toLong(),
            lovers = profile.stats.lovers.toLong(),
            contestsWon = profile.stats.contestsWon.toLong(),
            relationshipStatus = profile.relationshipStatus.name,
            selectedNiches = profile.selectedNiches.joinToString(","),
            customNiches = profile.customNiches.joinToString(","),
            createdAt = profile.createdAt,
            cachedAt = System.currentTimeMillis()
        )
        
        queries.deleteBioLinksByUserId(profile.id)
        profile.bioLinks.forEach { link ->
            queries.insertOrReplaceBioLink(
                id = link.id,
                userId = profile.id,
                label = link.label,
                url = link.url,
                icon = link.icon,
                sortOrder = link.sortOrder.toLong()
            )
        }
    }
    
    suspend fun getCachedProfile(userId: String): UserProfile? = withContext(Dispatchers.IO) {
        val profileEntity = queries.getProfileById(userId).executeAsOneOrNull() ?: return@withContext null
        val bioLinks = queries.getBioLinksByUserId(userId).executeAsList()
        mapToUserProfile(profileEntity, bioLinks)
    }
    
    suspend fun getCachedMyProfile(): UserProfile? = withContext(Dispatchers.IO) {
        val profileEntity = queries.getMyProfile().executeAsOneOrNull() ?: return@withContext null
        val bioLinks = queries.getBioLinksByUserId(profileEntity.id).executeAsList()
        mapToUserProfile(profileEntity, bioLinks)
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        queries.deleteAllBioLinks()
        queries.deleteAllProfiles()
    }
    
    private fun mapToUserProfile(entity: com.krieta.db.UserProfile, bioLinks: List<com.krieta.db.BioLink>) = UserProfile(
        id = entity.id,
        username = entity.username,
        firstName = entity.firstName,
        lastName = entity.lastName,
        avatarUrl = entity.avatarUrl,
        coverPhotoUrl = entity.coverPhotoUrl,
        bio = entity.bio,
        country = entity.country,
        currency = entity.currency,
        accountType = parseAccountType(entity.accountType),
        isVerified = entity.isVerified != 0L,
        isWalletUnlocked = entity.isWalletUnlocked != 0L,
        bioLinks = bioLinks.map {
            BioLink(id = it.id, label = it.label, url = it.url, icon = it.icon, sortOrder = it.sortOrder.toInt())
        },
        stats = ProfileStats(
            admirers = entity.admirers.toInt(),
            admiring = entity.admiring.toInt(),
            lovers = entity.lovers.toInt(),
            contestsWon = entity.contestsWon.toInt()
        ),
        relationshipStatus = parseRelationship(entity.relationshipStatus),
        selectedNiches = if (entity.selectedNiches.isBlank()) emptyList() else entity.selectedNiches.split(","),
        customNiches = if (entity.customNiches.isBlank()) emptyList() else entity.customNiches.split(","),
        createdAt = entity.createdAt
    )
    
    private fun parseAccountType(v: String) = try {
        AccountType.valueOf(v)
    } catch (_: Exception) {
        AccountType.CREATOR
    }
    
    private fun parseRelationship(v: String) = try {
        RelationshipStatus.valueOf(v)
    } catch (_: Exception) {
        RelationshipStatus.NONE
    }
}
