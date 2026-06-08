package com.krieta.feature.shorts.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.com.core.offline.ActionType
import com.krieta.com.core.offline.EntityType
import com.krieta.com.core.offline.OfflineActionQueue
import com.krieta.feature.shorts.data.local.ShortLocalDataSource
import com.krieta.feature.shorts.data.remote.ShortsApi
import com.krieta.feature.shorts.domain.model.LinkedProduct
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.model.ShortComment
import com.krieta.feature.shorts.domain.model.ShortCreator
import com.krieta.feature.shorts.domain.model.ToggleLikeResponse
import com.krieta.feature.shorts.domain.repository.ShortsFeedResult
import com.krieta.feature.shorts.domain.repository.ShortsRepository

class ShortsRepositoryImpl(
    private val api: ShortsApi,
    private val localDataSource: ShortLocalDataSource,
    private val offlineQueue: OfflineActionQueue
) : ShortsRepository {

    override suspend fun getFeed(tab: String, cursor: String?): NetworkResult<ShortsFeedResult> {
        // Load from cache first
        val cachedShorts = localDataSource.getCachedShorts()
        
        return when (val result = safeApiCall {
            val dto = api.getFeed(tab, cursor)
            ShortsFeedResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }) {
            is NetworkResult.Success -> {
                // Cache fresh data
                localDataSource.cacheShorts(result.data.items)
                result
            }
            is NetworkResult.Error -> {
                // Return cached data if available
                if (cachedShorts.isNotEmpty()) {
                    NetworkResult.Success(ShortsFeedResult(cachedShorts, null))
                } else {
                    result
                }
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun getShortById(shortId: String): NetworkResult<Short> {
        // Load from cache first
        val cachedShort = localDataSource.getCachedShortById(shortId)
        
        return when (val result = safeApiCall {
            val dto = api.getShortById(shortId)
            dto.toDomain()
        }) {
            is NetworkResult.Success -> {
                // Cache fresh data
                localDataSource.cacheShorts(listOf(result.data))
                result
            }
            is NetworkResult.Error -> {
                // Return cached data if available
                if (cachedShort != null) {
                    NetworkResult.Success(cachedShort)
                } else {
                    result
                }
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun toggleLike(shortId: String): NetworkResult<ToggleLikeResponse> {
        // Update cache optimistically
        val cachedShort = localDataSource.getCachedShortById(shortId)
        if (cachedShort != null) {
            val newLikeState = !cachedShort.isLiked
            val newCount = if (newLikeState) cachedShort.likesCount + 1 else cachedShort.likesCount - 1
            localDataSource.updateShortLike(shortId, newLikeState, newCount)
        }
        
        return when (val result = safeApiCall {
            val dto = api.toggleLike(shortId)
            ToggleLikeResponse(dto.liked, dto.likesCount)
        }) {
            is NetworkResult.Success -> result
            is NetworkResult.Error -> {
                // Queue for later if offline
                offlineQueue.queueAction(
                    actionType = if (cachedShort?.isLiked == true) ActionType.UNLIKE else ActionType.LIKE,
                    entityType = EntityType.SHORT,
                    entityId = shortId,
                    payload = emptyMap()
                )
                NetworkResult.Success(ToggleLikeResponse(
                    liked = cachedShort?.isLiked?.not() ?: true,
                    likesCount = if (cachedShort != null) {
                        if (cachedShort.isLiked) cachedShort.likesCount - 1 else cachedShort.likesCount + 1
                    } else null
                ))
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun getComments(shortId: String, cursor: String?): NetworkResult<List<ShortComment>> {
        return safeApiCall {
            val dto = api.getComments(shortId, cursor)
            dto.items.map { c ->
                ShortComment(
                    id = c.id,
                    user = ShortCreator(
                        id = c.user.id,
                        username = c.user.username,
                        displayName = c.user.displayName,
                        avatarUrl = c.user.avatarUrl,
                        isVerified = c.user.isVerified,
                        accountType = c.user.accountType
                    ),
                    text = c.text,
                    createdAt = c.createdAt
                )
            }
        }
    }

    override suspend fun addComment(shortId: String, text: String): NetworkResult<ShortComment> {
        return when (val result = safeApiCall {
            val c = api.addComment(shortId, text)
            ShortComment(
                id = c.id,
                user = ShortCreator(
                    id = c.user.id,
                    username = c.user.username,
                    displayName = c.user.displayName,
                    avatarUrl = c.user.avatarUrl,
                    isVerified = c.user.isVerified,
                    accountType = c.user.accountType
                ),
                text = c.text,
                createdAt = c.createdAt
            )
        }) {
            is NetworkResult.Success -> result
            is NetworkResult.Error -> {
                // Queue for later if offline
                offlineQueue.queueAction(
                    actionType = ActionType.COMMENT,
                    entityType = EntityType.SHORT,
                    entityId = shortId,
                    payload = mapOf("text" to text)
                )
                // Return optimistic result
                NetworkResult.Success(ShortComment(
                    id = "temp_${System.currentTimeMillis()}",
                    user = ShortCreator("", "", "", null, false, "CREATOR"),
                    text = text,
                    createdAt = ""
                ))
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun incrementView(shortId: String) {
        try { api.incrementView(shortId) } catch (_: Exception) {}
    }

    override suspend fun createShort(
        videoUrl: String,
        caption: String,
        isLocked: Boolean,
        unlockAmountKr: Double?
    ): NetworkResult<Short> {
        return safeApiCall { 
            val dto = api.createShort(
                com.krieta.feature.shorts.data.remote.dto.CreateShortRequestDto(
                    videoUrl = videoUrl,
                    caption = caption,
                    isLocked = isLocked,
                    unlockAmountKr = unlockAmountKr
                )
            )
            dto.toDomain()
        }
    }

    private fun com.krieta.feature.shorts.data.remote.dto.ShortDto.toDomain(): Short {
        return Short(
            id = id,
            creator = ShortCreator(
                id = creator.id,
                username = creator.username,
                displayName = creator.displayName,
                avatarUrl = creator.avatarUrl,
                isVerified = creator.isVerified,
                accountType = creator.accountType
            ),
            videoUrl = videoUrl,
            thumbnailUrl = thumbnailUrl,
            caption = caption,
            musicTrack = musicTrack,
            contestId = contestId,
            collectionId = collectionId,
            linkedProduct = linkedProduct?.let {
                LinkedProduct(id = it.id, title = it.title, imageUrl = it.imageUrl, priceKr = it.priceKr)
            },
            isLocked = isLocked,
            requiredTier = requiredTier,
            likesCount = likesCount,
            commentsCount = commentsCount,
            views = views,
            isLiked = isLiked,
            createdAt = createdAt
        )
    }
}
