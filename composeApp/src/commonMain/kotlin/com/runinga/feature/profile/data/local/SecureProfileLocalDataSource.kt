package com.runinga.feature.profile.data.local

import com.runinga.com.core.security.DatabaseEncryption
import com.runinga.com.core.security.DataIntegrityChecker
import com.runinga.com.core.security.InputValidator
import com.runinga.db.RuningaDatabase
import com.runinga.feature.profile.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

/**
 * Secure wrapper for ProfileLocalDataSource with encryption and validation
 */
class SecureProfileLocalDataSource(
    private val database: RuningaDatabase,
    private val encryption: DatabaseEncryption,
    private val integrityChecker: DataIntegrityChecker
) {
    
    private val queries = database.profileQueries
    
    suspend fun cacheProfile(profile: UserProfile) = withContext(Dispatchers.IO) {
        try {
            // Validate inputs
            val validatedId = InputValidator.validateId(profile.id, "Profile ID")
            val validatedUsername = InputValidator.validateText(profile.username, "Username")
            
            // Validate URLs if present
            profile.avatarUrl?.let { InputValidator.validateUrl(it) }
            profile.coverPhotoUrl?.let { InputValidator.validateUrl(it) }
            
            // Encrypt sensitive data
            val encryptedBio = profile.bio?.let { encryption.encrypt(it) }
            
            // Create integrity signature
            val dataToSign = "$validatedId|$validatedUsername|${System.currentTimeMillis()}"
            val signature = integrityChecker.createChecksum(dataToSign)
            
            // Cache with validation
            queries.insertOrReplaceProfile(
                id = validatedId,
                username = validatedUsername,
                firstName = InputValidator.validateText(profile.firstName, "First Name"),
                lastName = InputValidator.validateText(profile.lastName, "Last Name"),
                displayName = "${profile.firstName} ${profile.lastName}".trim(),
                avatarUrl = profile.avatarUrl,
                coverPhotoUrl = profile.coverPhotoUrl,
                bio = encryptedBio,
                country = InputValidator.validateText(profile.country, "Country"),
                currency = InputValidator.validateText(profile.currency, "Currency"),
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
            
            // Cache bio links with validation
            queries.deleteBioLinksByUserId(validatedId)
            profile.bioLinks.forEach { link ->
                val validatedLinkId = InputValidator.validateId(link.id, "Link ID")
                val validatedUrl = InputValidator.validateUrl(link.url)
                val validatedLabel = InputValidator.validateText(link.label, "Link Label")
                
                queries.insertOrReplaceBioLink(
                    id = validatedLinkId,
                    userId = validatedId,
                    label = validatedLabel,
                    url = validatedUrl,
                    icon = link.icon,
                    sortOrder = link.sortOrder.toLong()
                )
            }
            
            println("✅ Profile cached securely: $validatedUsername")
        } catch (e: SecurityException) {
            println("⚠️ Security validation failed: ${e.message}")
            throw e
        } catch (e: Exception) {
            println("❌ Failed to cache profile: ${e.message}")
            throw e
        }
    }
    
    suspend fun getCachedProfile(userId: String): UserProfile? = withContext(Dispatchers.IO) {
        try {
            // Validate input
            val validatedId = InputValidator.validateId(userId, "User ID")
            
            val profileEntity = queries.getProfileById(validatedId).executeAsOneOrNull() 
                ?: return@withContext null
            
            // Verify data age (prevent stale data attacks)
            val age = System.currentTimeMillis() - profileEntity.cachedAt
            if (age > 7 * 24 * 60 * 60 * 1000L) { // 7 days
                println("⚠️ Cached profile too old, removing")
                queries.deleteProfile(validatedId)
                return@withContext null
            }
            
            val bioLinks = queries.getBioLinksByUserId(validatedId).executeAsList()
            
            // Decrypt sensitive data
            val decryptedBio = profileEntity.bio?.let { 
                try {
                    encryption.decrypt(it)
                } catch (e: Exception) {
                    println("⚠️ Failed to decrypt bio, using null")
                    null
                }
            }
            
            UserProfile(
                id = profileEntity.id,
                username = profileEntity.username,
                firstName = profileEntity.firstName,
                lastName = profileEntity.lastName,
                avatarUrl = profileEntity.avatarUrl,
                coverPhotoUrl = profileEntity.coverPhotoUrl,
                bio = decryptedBio,
                country = profileEntity.country,
                currency = profileEntity.currency,
                accountType = parseAccountType(profileEntity.accountType),
                isVerified = profileEntity.isVerified != 0L,
                isWalletUnlocked = profileEntity.isWalletUnlocked != 0L,
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
        } catch (e: SecurityException) {
            println("⚠️ Security validation failed: ${e.message}")
            null
        } catch (e: Exception) {
            println("❌ Failed to retrieve cached profile: ${e.message}")
            null
        }
    }
    
    suspend fun getCachedMyProfile(): UserProfile? = withContext(Dispatchers.IO) {
        try {
            val profileEntity = queries.getMyProfile().executeAsOneOrNull() 
                ?: return@withContext null
            
            // Verify data age
            val age = System.currentTimeMillis() - profileEntity.cachedAt
            if (age > 7 * 24 * 60 * 60 * 1000L) {
                println("⚠️ Cached profile too old, removing")
                queries.deleteProfile(profileEntity.id)
                return@withContext null
            }
            
            val bioLinks = queries.getBioLinksByUserId(profileEntity.id).executeAsList()
            
            // Decrypt sensitive data
            val decryptedBio = profileEntity.bio?.let { 
                try {
                    encryption.decrypt(it)
                } catch (e: Exception) {
                    println("⚠️ Failed to decrypt bio")
                    null
                }
            }
            
            UserProfile(
                id = profileEntity.id,
                username = profileEntity.username,
                firstName = profileEntity.firstName,
                lastName = profileEntity.lastName,
                avatarUrl = profileEntity.avatarUrl,
                coverPhotoUrl = profileEntity.coverPhotoUrl,
                bio = decryptedBio,
                country = profileEntity.country,
                currency = profileEntity.currency,
                accountType = parseAccountType(profileEntity.accountType),
                isVerified = profileEntity.isVerified != 0L,
                isWalletUnlocked = profileEntity.isWalletUnlocked != 0L,
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
        } catch (e: Exception) {
            println("❌ Failed to retrieve cached profile: ${e.message}")
            null
        }
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

