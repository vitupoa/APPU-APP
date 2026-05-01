package com.krieta.feature.stories.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.stories.domain.model.StoryGroup
import com.krieta.feature.stories.domain.model.StoryPrivacy

interface StoryRepository {
    suspend fun getFeed(): NetworkResult<List<StoryGroup>>
    
    suspend fun getMyStories(): NetworkResult<List<StoryGroup>>
    
    suspend fun createStory(
        mediaUrl: String,
        mediaType: String,
        text: String?,
        privacy: StoryPrivacy,
        expiresInHours: Int
    ): NetworkResult<Unit>
    
    suspend fun viewStory(storyId: String): NetworkResult<Unit>
    
    suspend fun deleteStory(storyId: String): NetworkResult<Unit>
}
