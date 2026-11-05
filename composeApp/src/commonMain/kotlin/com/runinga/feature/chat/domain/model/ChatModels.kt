package com.runinga.feature.chat.domain.model

import kotlinx.datetime.Instant

enum class ChatType {
    DIRECT, GROUP
}

data class UserSnippet(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?
)

data class ChatMessage(
    val id: String,
    val chatId: String,
    val senderId: String,
    val sender: UserSnippet?,
    val payload: String,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val thumbnailUrl: String? = null,
    val isSystemEvent: Boolean = false,
    val status: String = "sent",
    val replyTo: ChatMessage? = null,
    val forwardedFrom: UserSnippet? = null,
    val repliesCount: Int = 0,
    val createdAt: Instant
)

data class ChatParticipant(
    val userId: String,
    val role: String,
    val joinedAt: Instant,
    val user: UserSnippet?
)

data class Chat(
    val id: String,
    val type: ChatType,
    val name: String? = null,
    val description: String? = null,
    val avatarUrl: String? = null,
    val participants: List<ChatParticipant>,
    val latestMessage: ChatMessage? = null,
    val createdAt: Instant,
    val updatedAt: Instant
)
