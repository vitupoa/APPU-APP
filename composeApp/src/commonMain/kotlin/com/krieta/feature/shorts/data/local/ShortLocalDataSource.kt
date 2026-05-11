package com.krieta.feature.shorts.data.local

import com.krieta.com.db.KrietaDatabase
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.model.ShortAuthor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class ShortLocalDataSource(private val database: KrietaDatabase) {
    
    private val queries = database.shortQueries
    
    suspend fun cacheShorts(shorts: List<Short>) = withContext(Dispatchers.IO) {
        shorts.forEach { short ->
            queries.insertOrReplaceShort(
                id = short.id,
                userId = short.author.id,
                username = short.author.username,
                userDisplayName = short.author.displayName,
                userAvatarUrl = short.author.avatarUrl,
                isVerified = short.author.isVerified,
                caption = short.caption,
                videoUrl = short.videoUrl,
                thumbnailUrl = short.thumbnailUrl,
                duration = short.duration.toLong(),
                aspectRatio = short.aspectRatio,
                likesCount = short.likesCount.toLong(),
                commentsCount = short.commentsCount.toLong(),
                sharesCount = short.sharesCount.toLong(),
                viewsCount = short.viewsCount.toLong(),
                isLiked = short.isLiked,
                isBookmarked = short.isBookmarked,
                createdAt = short.createdAt,
                cachedAt = System.currentTimeMillis()
            )
        }
    }
    
    suspend fun getCachedShorts(): List<Short> = withContext(Dispatchers.IO) {
        queries.getAllShorts().executeAsList().map { entity ->
            Short(
                id = entity.id,
                author = ShortAuthor(
                    id = entity.userId,
                    username = entity.username,
                    displayName = entity.userDisplayName,
                    avatarUrl = entity.userAvatarUrl,
                    isVerified = entity.isVerified
                ),
                caption = entity.caption,
                videoUrl = entity.videoUrl,
                thumbnailUrl = entity.thumbnailUrl,
                duration = entity.duration.toInt(),
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
    
    suspend fun getCachedShortById(shortId: String): Short? = withContext(Dispatchers.IO) {
        queries.getShortById(shortId).executeAsOneOrNull()?.let { entity ->
            Short(
                id = entity.id,
                author = ShortAuthor(
                    id = entity.userId,
                    username = entity.username,
                    displayName = entity.userDisplayName,
                    avatarUrl = entity.userAvatarUrl,
                    isVerified = entity.isVerified
                ),
                caption = entity.caption,
                videoUrl = entity.videoUrl,
                thumbnailUrl = entity.thumbnailUrl,
                duration = entity.duration.toInt(),
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
    
    suspend fun updateShortLike(shortId: String, isLiked: Boolean, likesCount: Int) = withContext(Dispatchers.IO) {
        queries.updateShortLike(isLiked, likesCount.toLong(), shortId)
    }
    
    suspend fun updateShortBookmark(shortId: String, isBookmarked: Boolean) = withContext(Dispatchers.IO) {
        queries.updateShortBookmark(isBookmarked, shortId)
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        queries.deleteAllShorts()
    }
}
