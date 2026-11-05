package com.runinga.feature.feed.data.local

import com.runinga.db.RuningaDatabase
import com.runinga.feature.feed.domain.model.Drip
import com.runinga.feature.feed.domain.model.DripAuthor
import com.runinga.com.core.util.currentTimeMillis
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class DripLocalDataSource(private val database: RuningaDatabase) {
    
    private val queries = database.dripQueries
    
    suspend fun cacheDrips(drips: List<Drip>) = withContext(Dispatchers.IO) {
        drips.forEach { drip ->
            queries.insertOrReplaceDrip(
                id = drip.id,
                userId = drip.author.id,
                username = drip.author.username,
                userDisplayName = drip.author.displayName,
                userAvatarUrl = drip.author.avatarUrl,
                isVerified = if (drip.author.isVerified) 1L else 0L,
                caption = drip.caption,
                mediaUrl = drip.mediaUrl,
                thumbnailUrl = drip.thumbnailUrl,
                mediaType = drip.mediaType,
                duration = drip.duration?.toLong(),
                aspectRatio = drip.aspectRatio?.toDouble(),
                likesCount = drip.likesCount.toLong(),
                commentsCount = drip.commentsCount.toLong(),
                sharesCount = drip.sharesCount.toLong(),
                viewsCount = drip.viewsCount.toLong(),
                isLiked = if (drip.isLiked) 1L else 0L,
                isBookmarked = if (drip.isBookmarked) 1L else 0L,
                createdAt = drip.createdAt,
                cachedAt = currentTimeMillis()
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
                    isVerified = entity.isVerified != 0L
                ),
                caption = entity.caption ?: "",
                mediaUrl = entity.mediaUrl,
                thumbnailUrl = entity.thumbnailUrl,
                mediaType = entity.mediaType,
                duration = entity.duration?.toInt(),
                aspectRatio = entity.aspectRatio?.toFloat(),
                likesCount = entity.likesCount.toInt(),
                commentsCount = entity.commentsCount.toInt(),
                sharesCount = entity.sharesCount.toInt(),
                viewsCount = entity.viewsCount.toInt(),
                isLiked = entity.isLiked != 0L,
                isBookmarked = entity.isBookmarked != 0L,
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
                    isVerified = entity.isVerified != 0L
                ),
                caption = entity.caption ?: "",
                mediaUrl = entity.mediaUrl,
                thumbnailUrl = entity.thumbnailUrl,
                mediaType = entity.mediaType,
                duration = entity.duration?.toInt(),
                aspectRatio = entity.aspectRatio?.toFloat(),
                likesCount = entity.likesCount.toInt(),
                commentsCount = entity.commentsCount.toInt(),
                sharesCount = entity.sharesCount.toInt(),
                viewsCount = entity.viewsCount.toInt(),
                isLiked = entity.isLiked != 0L,
                isBookmarked = entity.isBookmarked != 0L,
                createdAt = entity.createdAt
            )
        }
    }
    
    suspend fun updateDripLike(dripId: String, isLiked: Boolean, likesCount: Int) = withContext(Dispatchers.IO) {
        queries.updateDripLike(if (isLiked) 1L else 0L, likesCount.toLong(), dripId)
    }
    
    suspend fun updateDripBookmark(dripId: String, isBookmarked: Boolean) = withContext(Dispatchers.IO) {
        queries.updateDripBookmark(if (isBookmarked) 1L else 0L, dripId)
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        queries.deleteAllDrips()
    }
}
