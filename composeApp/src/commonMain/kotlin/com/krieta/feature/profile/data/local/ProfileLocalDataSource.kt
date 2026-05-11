package com.krieta.feature.profile.data.local

import com.krieta.com.db.KrietaDatabase
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
            isVerified = profile.isVerified,
            isWalletUnlocked = profile.isWalletUnlocked,
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
        
        UserProfile(
            id = profileEntity.id,
            username = profileEntity.username,
            firstName = profileEntity.firstName,
            lastName = profileEntity.lastName,
            displayName = profileEntity.displayName,
            avatarUrl = profileEntity.avatarUrl,
            coverPhotoUrl = profileEntity.coverPhotoUrl,
            bio = profileEntity.bio,
            country = profileEntity.country,
            currency = profileEntity.currency,
            accountType = parseAccountType(profileEntity.accountType),
            isVerified = profileEntity.isVerified,
            isWalletUnlocked = profileEntity.isWalletUnlocked,
            bioLinks = bioLinks.map { 
                BioLink(
                    id = it.id,
                    label = it.label,
                    url = it.url,
                    icon = it.icon,
                    sortOrder = it.sortOrder.toInt()
                )
            },
            stats = ProfileStats(
                admirers = profileEntity.admirers.toInt(),
                admiring = profileEntity.admiring.toInt(),
                lovers = profileEntity.lovers.toInt(),
                contestsWon = profileEntity.contestsWon.toInt()
            ),
            relationshipStatus = parseRelationship(profileEntity.relationshipStatus),
            selectedNiches = if (profileEntity.selectedNiches.isBlank()) emptyList() 
                            else profileEntity.selectedNiches.split(","),
            customNiches = if (profileEntity.customNiches.isBlank()) emptyList() 
                          else profileEntity.customNiches.split(","),
            createdAt = profileEntity.createdAt
        )
    }
    
    suspend fun getCachedMyProfile(): UserProfile? = withContext(Dispatchers.IO) {
        val profileEntity = queries.getMyProfile().executeAsOneOrNull() ?: return@withContext null
        val bioLinks = queries.getBioLinksByUserId(profileEntity.id).executeAsList()
        
        UserProfile(
            id = profileEntity.id,
            username = profileEntity.username,
            firstName = profileEntity.firstName,
            lastName = profileEntity.lastName,
            displayName = profileEntity.displayName,
            avatarUrl = profileEntity.avatarUrl,
            coverPhotoUrl = profileEntity.coverPhotoUrl,
            bio = profileEntity.bio,
            country = profileEntity.country,
            currency = profileEntity.currency,
            accountType = parseAccountType(profileEntity.accountType),
            isVerified = profileEntity.isVerified,
            isWalletUnlocked = profileEntity.isWalletUnlocked,
            bioLinks = bioLinks.map { 
                BioLink(
                    id = it.id,
                    label = it.label,
                    url = it.url,
                    icon = it.icon,
                    sortOrder = it.sortOrder.toInt()
                )
            },
            stats = ProfileStats(
                admirers = profileEntity.admirers.toInt(),
                admiring = profileEntity.admiring.toInt(),
                lovers = profileEntity.lovers.toInt(),
                contestsWon = profileEntity.contestsWon.toInt()
            ),
            relationshipStatus = parseRelationship(profileEntity.relationshipStatus),
            selectedNiches = if (profileEntity.selectedNiches.isBlank()) emptyList() 
                            else profileEntity.selectedNiches.split(","),
            customNiches = if (profileEntity.customNiches.isBlank()) emptyList() 
                          else profileEntity.customNiches.split(","),
            createdAt = profileEntity.createdAt
        )
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        queries.deleteAllBioLinks()
        queries.deleteAllProfiles()
    }
    
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
