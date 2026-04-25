package com.krieta.feature.stories.domain.model

import kotlinx.datetime.Instant

enum class StoryPrivacy {
    PUBLIC,
    LOVERS,
    ADMIRERS,
    SPECIFIC_USERS
}

data class StoryCreator(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?
)

data class Story(
    val id: String,
    val mediaUrl: String,
    val mediaType: String, // "image", "video", "text"
    val text: String?,
    val createdAt: Instant,
    val expiresAt: Instant,
    val isViewed: Boolean
)

data class StoryGroup(
    val creator: StoryCreator,
    val stories: List<Story>
)
