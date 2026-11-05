package com.runinga.feature.feed.domain.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.feed.domain.model.Post
import com.runinga.feature.feed.presentation.viewmodel.ContentItem
import com.runinga.feature.feed.presentation.viewmodel.FeedComposition

data class FeedResult(val items: List<Post>, val nextCursor: String?)
data class DiscoverFeedResult(
    val content: List<ContentItem>,
    val nextCursor: String?,
    val composition: FeedComposition
)

interface FeedRepository {
    suspend fun getFeed(cursor: String?): NetworkResult<FeedResult>
    suspend fun getPostById(postId: String): NetworkResult<Post>
    suspend fun toggleLike(postId: String): NetworkResult<Boolean>
    suspend fun addComment(postId: String, text: String): NetworkResult<Unit>
    suspend fun createPost(
        caption: String,
        imageUrls: List<String>,
        isLocked: Boolean = false,
        unlockAmountKr: Double? = null
    ): NetworkResult<Post>
    
    // Recommendation system endpoints
    suspend fun getDiscoverFeed(limit: Int, cursor: String?): NetworkResult<DiscoverFeedResult>
    suspend fun getAdmiringFeed(limit: Int, cursor: String?): NetworkResult<DiscoverFeedResult>
    suspend fun trackInteraction(
        contentId: String,
        contentType: String,
        signalType: String,
        watchDuration: Long,
        totalDuration: Long
    ): NetworkResult<Unit>
}
