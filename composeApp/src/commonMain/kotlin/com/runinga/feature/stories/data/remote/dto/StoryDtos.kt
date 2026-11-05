package com.runinga.feature.stories.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class StoryCreatorDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null
)

@Serializable
data class StoryDto(
    val id: String,
    val mediaUrl: String,
    val mediaType: String,
    val text: String? = null,
    val createdAt: String,
    val expiresAt: String,
    val isViewed: Boolean = false
)

@Serializable
data class StoryGroupDto(
    val creator: StoryCreatorDto,
    val stories: List<StoryDto>
)

@Serializable
data class FeedResponseDto(
    val success: Boolean,
    val feed: List<StoryGroupDto>
)

@Serializable
data class CreateStoryRequestDto(
    val mediaUrl: String,
    val mediaType: String,
    val text: String? = null,
    val privacy: String = "PUBLIC",
    val expiresInHours: Int = 24
)
