package com.krieta.feature.chat.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.chat.data.remote.ChatApi
import com.krieta.feature.chat.data.remote.dto.ChatDto
import com.krieta.feature.chat.data.remote.dto.ChatParticipantDto
import com.krieta.feature.chat.data.remote.dto.MessageDto
import com.krieta.feature.chat.data.remote.dto.UserSnippetDto
import com.krieta.feature.chat.domain.model.Chat
import com.krieta.feature.chat.domain.model.ChatMessage
import com.krieta.feature.chat.domain.model.ChatParticipant
import com.krieta.feature.chat.domain.model.ChatType
import com.krieta.feature.chat.domain.model.UserSnippet
import com.krieta.feature.chat.domain.repository.ChatRepository
import kotlinx.datetime.Instant

class ChatRepositoryImpl(
    private val api: ChatApi
) : ChatRepository {

    override suspend fun getChats(page: Int): NetworkResult<List<Chat>> {
        return safeApiCall {
            api.getChats(page).chats.map { it.toDomain() }
        }
    }

    override suspend fun createDirectChat(recipientId: String): NetworkResult<Chat> {
        return safeApiCall {
            api.createDirectChat(recipientId).chat.toDomain()
        }
    }

    override suspend fun createGroupChat(
        name: String,
        description: String?,
        participantIds: List<String>
    ): NetworkResult<Chat> {
        return safeApiCall {
            api.createGroupChat(name, description, participantIds).chat.toDomain()
        }
    }

    override suspend fun getMessages(chatId: String, page: Int): NetworkResult<List<ChatMessage>> {
        return safeApiCall {
            api.getMessages(chatId, page).messages.map { it.toDomain() }
        }
    }

    override suspend fun sendMessage(
        chatId: String,
        payload: String,
        mediaUrl: String?,
        mediaType: String?,
        replyToId: String?
    ): NetworkResult<ChatMessage> {
        return safeApiCall {
            api.sendMessage(chatId, payload, mediaUrl, mediaType, replyToId).message.toDomain()
        }
    }

    override suspend fun updateGroupChat(
        chatId: String,
        name: String?,
        description: String?,
        avatarUrl: String?
    ): NetworkResult<Chat> {
        return safeApiCall {
            api.updateGroupChat(chatId, name, description, avatarUrl).chat.toDomain()
        }
    }

    override suspend fun manageMember(
        chatId: String,
        userId: String,
        action: String
    ): NetworkResult<Boolean> {
        return safeApiCall {
            api.manageMember(chatId, userId, action).success
        }
    }

    override suspend fun transferOwnership(
        chatId: String,
        newOwnerId: String
    ): NetworkResult<Boolean> {
        return safeApiCall {
            api.transferOwnership(chatId, newOwnerId).success
        }
    }

    override suspend fun leaveGroup(chatId: String): NetworkResult<Boolean> {
        return safeApiCall {
            api.leaveGroup(chatId).success
        }
    }

    override suspend fun searchGroups(query: String): NetworkResult<List<Chat>> {
        return safeApiCall {
            api.searchGroups(query).chats.map { it.toDomain() }
        }
    }

    private fun ChatDto.toDomain(): Chat {
        return Chat(
            id = id,
            type = if (type == "GROUP") ChatType.GROUP else ChatType.DIRECT,
            name = name,
            description = description,
            avatarUrl = avatarUrl,
            participants = participants.map { it.toDomain() },
            latestMessage = messages.firstOrNull()?.toDomain(),
            createdAt = parseInstant(createdAt),
            updatedAt = parseInstant(updatedAt)
        )
    }

    private fun ChatParticipantDto.toDomain(): ChatParticipant {
        return ChatParticipant(
            userId = userId,
            role = role,
            joinedAt = parseInstant(joinedAt),
            user = user.toDomain()
        )
    }

    private fun MessageDto.toDomain(): ChatMessage {
        return ChatMessage(
            id = id,
            chatId = chatId,
            senderId = senderId,
            sender = sender?.toDomain(),
            payload = payload,
            mediaUrl = mediaUrl,
            mediaType = mediaType,
            isSystemEvent = isSystemEvent,
            status = status,
            createdAt = parseInstant(createdAt)
        )
    }

    private fun UserSnippetDto.toDomain(): UserSnippet {
        return UserSnippet(
            id = id,
            username = username,
            displayName = displayName,
            avatarUrl = avatarUrl
        )
    }

    private fun parseInstant(dateString: String): Instant {
        return try {
            Instant.parse(dateString)
        } catch (_: Exception) {
            Instant.DISTANT_PAST
        }
    }
}
