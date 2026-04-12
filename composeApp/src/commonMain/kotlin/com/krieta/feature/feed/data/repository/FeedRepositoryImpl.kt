package com.krieta.feature.feed.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.feed.data.remote.FeedApi
import com.krieta.feature.feed.data.remote.dto.PostDto
import com.krieta.feature.feed.domain.model.Post
import com.krieta.feature.feed.domain.model.PostCreator
import com.krieta.feature.feed.domain.repository.FeedRepository
import com.krieta.feature.feed.domain.repository.FeedResult

class FeedRepositoryImpl(
    private val api: FeedApi
) : FeedRepository {

    override suspend fun getFeed(cursor: String?): NetworkResult<FeedResult> {
        return safeApiCall {
            val dto = api.getFeed(cursor)
            FeedResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }
    }

    override suspend fun toggleLike(postId: String): NetworkResult<Boolean> {
        return safeApiCall { api.toggleLike(postId).liked }
    }

    override suspend fun addComment(postId: String, text: String): NetworkResult<Unit> {
        return safeApiCall { api.addComment(postId, text); Unit }
    }

    override suspend fun createPost(caption: String, imageUrls: List<String>): NetworkResult<Unit> {
        return safeApiCall { api.createPost(caption, imageUrls); Unit }
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
}
