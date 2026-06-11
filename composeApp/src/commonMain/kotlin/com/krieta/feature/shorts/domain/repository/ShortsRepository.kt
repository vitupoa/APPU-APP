package com.krieta.feature.shorts.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.model.ShortComment
import com.krieta.feature.shorts.domain.model.ToggleLikeResponse

data class ShortsFeedResult(val items: List<Short>, val nextCursor: String?)

interface ShortsRepository {
    suspend fun getFeed(tab: String, cursor: String?): NetworkResult<ShortsFeedResult>
    suspend fun getShortById(shortId: String): NetworkResult<Short>
    suspend fun toggleLike(shortId: String): NetworkResult<ToggleLikeResponse>
    suspend fun toggleBookmark(shortId: String): NetworkResult<ToggleLikeResponse>
    suspend fun getComments(shortId: String, cursor: String?): NetworkResult<List<ShortComment>>
    suspend fun addComment(shortId: String, text: String): NetworkResult<ShortComment>
    suspend fun incrementView(shortId: String)
    suspend fun createShort(
        videoUrl: String,
        caption: String,
        isLocked: Boolean = false,
        unlockAmountKr: Double? = null
    ): NetworkResult<Short>
}
