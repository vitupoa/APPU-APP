package com.krieta.feature.feed.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.feed.domain.model.Post

data class FeedResult(val items: List<Post>, val nextCursor: String?)

interface FeedRepository {
    suspend fun getFeed(cursor: String?): NetworkResult<FeedResult>
    suspend fun toggleLike(postId: String): NetworkResult<Boolean>
    suspend fun addComment(postId: String, text: String): NetworkResult<Unit>
    suspend fun createPost(caption: String, imageUrls: List<String>): NetworkResult<Unit>
}
