package com.krieta.feature.stories.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.stories.data.remote.dto.CreateStoryRequestDto
import com.krieta.feature.stories.data.remote.dto.FeedResponseDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.delete
import io.ktor.client.request.setBody

class StoryApi(private val client: HttpClient) {

    suspend fun getFeed(): FeedResponseDto {
        return client.get("${ApiConstants.STORIES}/feed").body()
    }

    suspend fun createStory(request: CreateStoryRequestDto): String {
        return client.post(ApiConstants.STORIES) {
            setBody(request)
        }.body()
    }

    suspend fun viewStory(storyId: String) {
        client.post("${ApiConstants.STORIES}/$storyId/view")
    }
    
    suspend fun getMyStories(): FeedResponseDto {
        return client.get("${ApiConstants.STORIES}/me").body()
    }
    
    suspend fun deleteStory(storyId: String) {
        client.delete("${ApiConstants.STORIES}/$storyId")
    }
}
