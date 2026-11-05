package com.runinga.feature.feed.data.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.safeApiCall
import com.runinga.com.core.offline.ActionType
import com.runinga.com.core.offline.EntityType
import com.runinga.com.core.offline.MediaCacheManager
import com.runinga.com.core.offline.MediaType
import com.runinga.com.core.offline.OfflineActionQueue
import com.runinga.com.core.util.currentTimeMillis
import com.runinga.feature.feed.data.local.DripLocalDataSource
import com.runinga.feature.feed.data.remote.FeedApi
import com.runinga.feature.feed.data.remote.dto.PostDto
import com.runinga.feature.feed.domain.model.Post
import com.runinga.feature.feed.domain.model.PostCreator
import com.runinga.feature.feed.domain.repository.FeedRepository
import com.runinga.feature.feed.domain.repository.FeedResult
import com.runinga.feature.feed.domain.repository.DiscoverFeedResult
import com.runinga.feature.feed.presentation.viewmodel.ContentItem
import com.runinga.feature.feed.presentation.viewmodel.FeedComposition
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope

class FeedRepositoryImpl(
    private val api: FeedApi,
    private val localDataSource: DripLocalDataSource,
    private val offlineQueue: OfflineActionQueue,
    private val mediaCache: MediaCacheManager
) : FeedRepository {

    // Client-side cache for feeds (5 minutes TTL)
    private val feedCache = mutableMapOf<String, Pair<DiscoverFeedResult, Long>>()
    private val CACHE_DURATION = 5 * 60 * 1000L // 5 minutes

    override suspend fun getFeed(cursor: String?): NetworkResult<FeedResult> {
        return safeApiCall {
            val dto = api.getFeed(cursor)
            FeedResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }
    }

    override suspend fun getPostById(postId: String): NetworkResult<Post> {
        return safeApiCall {
            val dto = api.getPostById(postId)
            dto.toDomain()
        }
    }

    override suspend fun toggleLike(postId: String): NetworkResult<Boolean> {
        // Update cache optimistically
        val cachedDrip = localDataSource.getCachedDripById(postId)
        if (cachedDrip != null) {
            val newLikeState = !cachedDrip.isLiked
            val newCount = if (newLikeState) cachedDrip.likesCount + 1 else cachedDrip.likesCount - 1
            localDataSource.updateDripLike(postId, newLikeState, newCount)
        }
        
        return when (val result = safeApiCall { api.toggleLike(postId).liked }) {
            is NetworkResult.Success -> result
            is NetworkResult.Error -> {
                // Queue for later if offline
                offlineQueue.queueAction(
                    actionType = if (cachedDrip?.isLiked == true) ActionType.UNLIKE else ActionType.LIKE,
                    entityType = EntityType.DRIP,
                    entityId = postId,
                    payload = emptyMap()
                )
                NetworkResult.Success(cachedDrip?.isLiked?.not() ?: true)
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun addComment(postId: String, text: String): NetworkResult<Unit> {
        return when (val result = safeApiCall { api.addComment(postId, text); Unit }) {
            is NetworkResult.Success -> result
            is NetworkResult.Error -> {
                // Queue for later if offline
                offlineQueue.queueAction(
                    actionType = ActionType.COMMENT,
                    entityType = EntityType.DRIP,
                    entityId = postId,
                    payload = mapOf("text" to text)
                )
                NetworkResult.Success(Unit)
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun createPost(
        caption: String,
        imageUrls: List<String>,
        isLocked: Boolean,
        unlockAmountKr: Double?
    ): NetworkResult<Post> {
        return safeApiCall { 
            val dto = api.createPost(caption, imageUrls, isLocked, unlockAmountKr)
            dto.toDomain()
        }
    }

    // Recommendation system methods
    override suspend fun getDiscoverFeed(limit: Int, cursor: String?): NetworkResult<DiscoverFeedResult> {
        // Check client-side cache
        val cacheKey = "discover_${limit}_${cursor ?: "initial"}"
        val cached = feedCache[cacheKey]
        
        if (cached != null && currentTimeMillis() - cached.second < CACHE_DURATION) {
            return NetworkResult.Success(cached.first)
        }
        
        return safeApiCall {
            val response = api.getDiscoverFeed(limit, cursor)
            val result = DiscoverFeedResult(
                content = response.content.map { it.toContentItem() },
                nextCursor = response.nextCursor,
                composition = FeedComposition(
                    personalized = response.composition.personalized,
                    admiring = response.composition.admiring,
                    trending = response.composition.trending,
                    discovery = response.composition.discovery
                )
            )
            // Cache the result
            feedCache[cacheKey] = result to currentTimeMillis()
            result
        }
    }

    override suspend fun getAdmiringFeed(limit: Int, cursor: String?): NetworkResult<DiscoverFeedResult> {
        // Check client-side cache
        val cacheKey = "admiring_${limit}_${cursor ?: "initial"}"
        val cached = feedCache[cacheKey]
        
        if (cached != null && currentTimeMillis() - cached.second < CACHE_DURATION) {
            return NetworkResult.Success(cached.first)
        }
        
        return safeApiCall {
            val response = api.getAdmiringFeed(limit, cursor)
            val result = DiscoverFeedResult(
                content = response.content.map { it.toContentItem() },
                nextCursor = response.nextCursor,
                composition = FeedComposition(
                    personalized = 0,
                    admiring = response.content.size,
                    trending = 0,
                    discovery = 0
                )
            )
            // Cache the result
            feedCache[cacheKey] = result to currentTimeMillis()
            result
        }
    }

    override suspend fun trackInteraction(
        contentId: String,
        contentType: String,
        signalType: String,
        watchDuration: Long,
        totalDuration: Long
    ): NetworkResult<Unit> {
        return safeApiCall {
            api.trackInteraction(
                contentId = contentId,
                contentType = contentType,
                signalType = signalType,
                watchDuration = watchDuration,
                totalDuration = totalDuration
            )
            
            // Invalidate cache on interaction to get fresh recommendations
            if (signalType in listOf("LIKE", "UNLIKE", "SHARE", "COMMENT")) {
                feedCache.clear()
            }
            
            Unit
        }
    }

    private fun PostDto.toDomain() = Post(
        id = id,
        creator = PostCreator(
            id = creator.id,
            username = creator.username,
            displayName = creator.displayName,
            avatarUrl = creator.avatarUrl,
            isVerified = creator.isVerified,
            accountType = creator.accountType
        ),
        imageUrls = imageUrls,
        caption = caption,
        isLocked = isLocked,
        requiredTier = requiredTier,
        likesCount = likesCount,
        commentsCount = commentsCount,
        isLiked = isLiked,
        createdAt = createdAt
    )

    private fun Any.toContentItem(): ContentItem {
        // Map API response to ContentItem
        val map = this as Map<*, *>
        return ContentItem(
            id = map["id"] as String,
            type = map["type"] as String,
            videoUrl = map["videoUrl"] as? String,
            imageUrls = (map["imageUrls"] as? List<*>)?.map { it as String },
            thumbnailUrl = map["thumbnailUrl"] as? String,
            caption = map["caption"] as? String,
            userId = map["userId"] as String,
            userName = map["userName"] as String,
            userAvatar = map["userAvatar"] as? String,
            isAdmired = map["isAdmired"] as? Boolean ?: false,
            likesCount = (map["likesCount"] as? Number)?.toInt() ?: 0,
            commentsCount = (map["commentsCount"] as? Number)?.toInt() ?: 0,
            isLiked = map["isLiked"] as? Boolean ?: false,
            isLocked = map["isLocked"] as? Boolean ?: false,
            isContest = map["isContest"] as? Boolean ?: false,
            isAd = map["isAd"] as? Boolean ?: false,
            createdAt = map["createdAt"] as String
        )
    }
}
