package com.krieta.feature.shorts.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.shorts.data.remote.ShortsApi
import com.krieta.feature.shorts.domain.model.LinkedProduct
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.model.ShortComment
import com.krieta.feature.shorts.domain.model.ShortCreator
import com.krieta.feature.shorts.domain.repository.ShortsFeedResult
import com.krieta.feature.shorts.domain.repository.ShortsRepository

class ShortsRepositoryImpl(
    private val api: ShortsApi
) : ShortsRepository {

    override suspend fun getFeed(tab: String, cursor: String?): NetworkResult<ShortsFeedResult> {
        return safeApiCall {
            val dto = api.getFeed(tab, cursor)
            ShortsFeedResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }
    }

    override suspend fun toggleLike(shortId: String): NetworkResult<Boolean> {
        return safeApiCall {
            val dto = api.toggleLike(shortId)
            dto.liked
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
        return safeApiCall {
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
        }
    }

    override suspend fun incrementView(shortId: String) {
        try { api.incrementView(shortId) } catch (_: Exception) {}
    }

    override suspend fun createShort(videoUrl: String, caption: String): NetworkResult<Unit> {
        return safeApiCall { 
            api.createShort(
                com.krieta.feature.shorts.data.remote.dto.CreateShortRequestDto(
                    videoUrl = videoUrl,
                    caption = caption
                )
            )
            Unit 
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
