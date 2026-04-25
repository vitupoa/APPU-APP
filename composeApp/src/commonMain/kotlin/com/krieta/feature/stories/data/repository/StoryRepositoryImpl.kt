package com.krieta.feature.stories.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.stories.data.remote.StoryApi
import com.krieta.feature.stories.data.remote.dto.CreateStoryRequestDto
import com.krieta.feature.stories.domain.model.Story
import com.krieta.feature.stories.domain.model.StoryCreator
import com.krieta.feature.stories.domain.model.StoryGroup
import com.krieta.feature.stories.domain.model.StoryPrivacy
import com.krieta.feature.stories.domain.repository.StoryRepository
import kotlinx.datetime.Instant

import com.krieta.com.core.network.safeApiCall

class StoryRepositoryImpl(
    private val api: StoryApi
) : StoryRepository {

    override suspend fun getFeed(): NetworkResult<List<StoryGroup>> {
        return safeApiCall {
            val response = api.getFeed()
            if (response.success) {
                response.feed.map { groupDto ->
                    StoryGroup(
                        creator = StoryCreator(
                            id = groupDto.creator.id,
                            username = groupDto.creator.username,
                            displayName = groupDto.creator.displayName,
                            avatarUrl = groupDto.creator.avatarUrl
                        ),
                        stories = groupDto.stories.map { storyDto ->
                            Story(
                                id = storyDto.id,
                                mediaUrl = storyDto.mediaUrl,
                                mediaType = storyDto.mediaType,
                                text = storyDto.text,
                                createdAt = try { Instant.parse(storyDto.createdAt) } catch (e: Exception) { Instant.DISTANT_PAST },
                                expiresAt = try { Instant.parse(storyDto.expiresAt) } catch (e: Exception) { Instant.DISTANT_FUTURE },
                                isViewed = storyDto.isViewed
                            )
                        }
                    )
                }
            } else {
                throw Exception("Failed to fetch stories feed")
            }
        }
    }

    override suspend fun createStory(
        mediaUrl: String,
        mediaType: String,
        text: String?,
        privacy: StoryPrivacy,
        expiresInHours: Int
    ): NetworkResult<Unit> {
        return safeApiCall {
            api.createStory(
                CreateStoryRequestDto(
                    mediaUrl = mediaUrl,
                    mediaType = mediaType,
                    text = text,
                    privacy = privacy.name,
                    expiresInHours = expiresInHours
                )
            )
        }
    }

    override suspend fun viewStory(storyId: String): NetworkResult<Unit> {
        return safeApiCall {
            api.viewStory(storyId)
        }
    }
}
