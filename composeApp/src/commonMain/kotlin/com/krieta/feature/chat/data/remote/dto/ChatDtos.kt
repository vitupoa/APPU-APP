package com.krieta.feature.chat.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class UserSnippetDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null
)

@Serializable
data class ChatParticipantDto(
    val id: String,
    val chatId: String,
    val userId: String,
    val role: String = "member",
    val joinedAt: String,
    val lastRead: String,
    val user: UserSnippetDto
)

@Serializable
data class MessageDto(
    val id: String,
    val chatId: String,
    val senderId: String,
    val payload: String,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val isSystemEvent: Boolean = false,
    val status: String = "sent",
    val replyToId: String? = null,
    val forwardedFromId: String? = null,
    val createdAt: String,
    val sender: UserSnippetDto? = null,
    val replyTo: MessageDto? = null,
    val forwardedFrom: UserSnippetDto? = null
)

@Serializable
data class ChatDto(
    val id: String,
    val type: String, // DIRECT, GROUP
    val name: String? = null,
    val description: String? = null,
    val avatarUrl: String? = null,
    val participants: List<ChatParticipantDto> = emptyList(),
    val messages: List<MessageDto> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class ChatListResponseDto(
    val success: Boolean,
    val chats: List<ChatDto>
)

@Serializable
data class ChatResponseDto(
    val success: Boolean,
    val chat: ChatDto
)

@Serializable
data class MessageResponseDto(
    val success: Boolean,
    val message: MessageDto
)

@Serializable
data class MessageListResponseDto(
    val success: Boolean,
    val messages: List<MessageDto>
)

@Serializable
data class CreateDirectChatRequest(
    @kotlinx.serialization.SerialName("recipient_id")
    val recipientId: String
)

@Serializable
data class CreateGroupChatRequest(
    val name: String,
    val description: String? = null,
    val participantIds: List<String>
)

@Serializable
data class SendMessageRequest(
    val payload: String,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val replyToId: String? = null,
    val forwardedFromId: String? = null
)

@Serializable
data class ForwardMessageRequest(
    val targetChatId: String
)

@Serializable
data class UpdateGroupChatRequest(
    val name: String? = null,
    val description: String? = null,
    val avatarUrl: String? = null
)

@Serializable
data class ManageMemberRequest(
    val userId: String,
    val action: String // promote, demote, kick
)

@Serializable
data class TransferOwnershipRequest(
    val newOwnerId: String
)

@Serializable
data class ActionResponse(
    val success: Boolean,
    val message: String? = null
)

@Serializable
data class TypingIndicatorRequest(
    val isTyping: Boolean
)

@Serializable
data class TypingIndicatorDto(
    val chatId: String,
    val userId: String,
    val user: UserSnippetDto,
    val isTyping: Boolean
)
