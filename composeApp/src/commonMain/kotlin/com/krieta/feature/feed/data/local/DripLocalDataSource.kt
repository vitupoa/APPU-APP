package com.krieta.feature.feed.data.local

import com.krieta.com.db.KrietaDatabase
import com.krieta.feature.feed.domain.model.Drip
import com.krieta.feature.feed.domain.model.DripAuthor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class DripLocalDataSource(private val database: KrietaDatabase) {
    
    private val queries = database.dripQueries
    
    suspend fun cacheDrips(drips: List<Drip>) = withContext(Dispatchers.IO) {
        drips.forEach { drip ->
            queries.insertOrReplaceDrip(
                id = drip.id,
                userId = drip.author.id,
                username = drip.author.username,
                userDisplayName = drip.author.displayName,
                userAvatarUrl = drip.author.avatarUrl,
                isVerified = drip.author.isVerified,
                caption = drip.caption,
                mediaUrl = drip.mediaUrl,
                thumbnailUrl = drip.thumbnailUrl,
                mediaType = drip.mediaType,
                duration = drip.duration?.toLong(),
                aspectRatio = drip.aspectRatio,
                likesCount = drip.likesCount.toLong(),
                commentsCount = drip.commentsCount.toLong(),
                sharesCount = drip.sharesCount.toLong(),
                viewsCount = drip.viewsCount.toLong(),
                isLiked = drip.isLiked,
                isBookmarked = drip.isBookmarked,
                createdAt = drip.createdAt,
                cachedAt = System.currentTimeMillis()
            )
        }
    }
    
    suspend fun getCachedDrips(): List<Drip> = withContext(Dispatchers.IO) {
        queries.getAllDrips().executeAsList().map { entity ->
            Drip(
                id = entity.id,
                author = DripAuthor(
                    id = entity.userId,
                    username = entity.username,
                    displayName = entity.userDisplayName,
                    avatarUrl = entity.userAvatarUrl,
                    isVerified = entity.isVerified
                ),
                caption = entity.caption,
                mediaUrl = entity.mediaUrl,
                thumbnailUrl = entity.thumbnailUrl,
                mediaType = entity.mediaType,
                duration = entity.duration?.toInt(),
                aspectRatio = entity.aspectRatio,
                likesCount = entity.likesCount.toInt(),
                commentsCount = entity.commentsCount.toInt(),
                sharesCount = entity.sharesCount.toInt(),
                viewsCount = entity.viewsCount.toInt(),
                isLiked = entity.isLiked,
                isBookmarked = entity.isBookmarked,
                createdAt = entity.createdAt
            )
        }
    }
    
    suspend fun getCachedDripById(dripId: String): Drip? = withContext(Dispatchers.IO) {
        queries.getDripById(dripId).executeAsOneOrNull()?.let { entity ->
            Drip(
                id = entity.id,
                author = DripAuthor(
                    id = entity.userId,
                    username = entity.username,
                    displayName = entity.userDisplayName,
                    avatarUrl = entity.userAvatarUrl,
                    isVerified = entity.isVerified
                ),
                caption = entity.caption,
                mediaUrl = entity.mediaUrl,
                thumbnailUrl = entity.thumbnailUrl,
                mediaType = entity.mediaType,
                duration = entity.duration?.toInt(),
                aspectRatio = entity.aspectRatio,
                likesCount = entity.likesCount.toInt(),
                commentsCount = entity.commentsCount.toInt(),
                sharesCount = entity.sharesCount.toInt(),
                viewsCount = entity.viewsCount.toInt(),
                isLiked = entity.isLiked,
                isBookmarked = entity.isBookmarked,
                createdAt = entity.createdAt
            )
        }
    }
    
    suspend fun updateDripLike(dripId: String, isLiked: Boolean, likesCount: Int) = withContext(Dispatchers.IO) {
        queries.updateDripLike(isLiked, likesCount.toLong(), dripId)
    }
    
    suspend fun updateDripBookmark(dripId: String, isBookmarked: Boolean) = withContext(Dispatchers.IO) {
        queries.updateDripBookmark(isBookmarked, dripId)
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        queries.deleteAllDrips()
    }
}
