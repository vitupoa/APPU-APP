package com.krieta.feature.shorts.data.local

import com.krieta.db.KrietaDatabase
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.model.ShortCreator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class ShortLocalDataSource(private val database: KrietaDatabase) {
    
    private val queries = database.shortQueries
    
    suspend fun cacheShorts(shorts: List<Short>) = withContext(Dispatchers.IO) {
        shorts.forEach { short ->
            queries.insertOrReplaceShort(
                id = short.id,
                userId = short.creator.id,
                username = short.creator.username,
                userDisplayName = short.creator.displayName,
                userAvatarUrl = short.creator.avatarUrl,
                isVerified = if (short.creator.isVerified) 1L else 0L,
                caption = short.caption,
                videoUrl = short.videoUrl,
                thumbnailUrl = short.thumbnailUrl,
                duration = 0L,
                aspectRatio = short.aspectRatio?.toDouble(),
                likesCount = short.likesCount.toLong(),
                commentsCount = short.commentsCount.toLong(),
                sharesCount = 0L,
                viewsCount = short.views.toLong(),
                isLiked = if (short.isLiked) 1L else 0L,
                isBookmarked = 0L,
                createdAt = short.createdAt,
                cachedAt = System.currentTimeMillis()
            )
        }
    }
    
    suspend fun getCachedShorts(): List<Short> = withContext(Dispatchers.IO) {
        queries.getAllShorts().executeAsList().map { entity -> mapToShort(entity) }
    }
    
    suspend fun getCachedShortById(shortId: String): Short? = withContext(Dispatchers.IO) {
        queries.getShortById(shortId).executeAsOneOrNull()?.let { mapToShort(it) }
    }
    
    suspend fun updateShortLike(shortId: String, isLiked: Boolean, likesCount: Int) = withContext(Dispatchers.IO) {
        queries.updateShortLike(if (isLiked) 1L else 0L, likesCount.toLong(), shortId)
    }
    
    suspend fun updateShortBookmark(shortId: String, isBookmarked: Boolean) = withContext(Dispatchers.IO) {
        queries.updateShortBookmark(if (isBookmarked) 1L else 0L, shortId)
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        queries.deleteAllShorts()
    }
    
    private fun mapToShort(entity: com.krieta.db.Short) = Short(
        id = entity.id,
        creator = ShortCreator(
            id = entity.userId,
            username = entity.username,
            displayName = entity.userDisplayName,
            avatarUrl = entity.userAvatarUrl,
            isVerified = entity.isVerified != 0L,
            accountType = "CREATOR"
        ),
        videoUrl = entity.videoUrl,
        thumbnailUrl = entity.thumbnailUrl,
        mediaType = "VIDEO",
        aspectRatio = entity.aspectRatio?.toFloat(),
        mediaUrls = emptyList(),
        caption = entity.caption ?: "",
        musicTrack = null,
        contestId = null,
        collectionId = null,
        linkedProduct = null,
        isLocked = false,
        requiredTier = null,
        likesCount = entity.likesCount.toInt(),
        commentsCount = entity.commentsCount.toInt(),
        views = entity.viewsCount.toInt(),
        isLiked = entity.isLiked != 0L,
        createdAt = entity.createdAt
    )
}
