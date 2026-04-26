package com.krieta.feature.chat.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chat.data.local.LocalMessageEntity
import com.krieta.feature.chat.data.local.OfflineMessageSyncService
import com.krieta.feature.chat.data.remote.ChatApi
import com.krieta.feature.chat.data.remote.dto.*
import com.krieta.feature.chat.domain.model.Chat
import com.krieta.feature.chat.domain.model.ChatMessage
import com.krieta.feature.chat.domain.model.ChatParticipant
import com.krieta.feature.chat.domain.model.ChatType
import com.krieta.feature.chat.domain.model.UserSnippet
import com.krieta.feature.chat.domain.repository.ChatRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.Instant
import java.util.UUID

class ChatRepositoryWithOfflineSupport(
    private val chatApi: ChatApi,
    private val offlineSyncService: OfflineMessageSyncService
) : ChatRepository {

    override suspend fun getChats(page: Int): NetworkResult<List<Chat>> {
        return try {
            if (offlineSyncService.isOnline.value) {
                val response = chatApi.getChats(page)
                NetworkResult.Success(response.chats.map { it.toDomain() })
            } else {
                NetworkResult.Error(message = "No internet connection")
            }
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to get chats")
        }
    }

    override suspend fun createDirectChat(recipientId: String): NetworkResult<Chat> {
        return try {
            if (offlineSyncService.isOnline.value) {
                val response = chatApi.createDirectChat(recipientId)
                NetworkResult.Success(response.chat.toDomain())
            } else {
                NetworkResult.Error(message = "No internet connection")
            }
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to create chat")
        }
    }

    override suspend fun createGroupChat(
        name: String,
        description: String?,
        participantIds: List<String>
    ): NetworkResult<Chat> {
        return try {
            if (offlineSyncService.isOnline.value) {
                val response = chatApi.createGroupChat(name, description, participantIds)
                NetworkResult.Success(response.chat.toDomain())
            } else {
                NetworkResult.Error(message = "No internet connection")
            }
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to create group chat")
        }
    }

    override suspend fun getMessages(chatId: String, page: Int): NetworkResult<List<ChatMessage>> {
        return try {
            if (offlineSyncService.isOnline.value) {
                val response = chatApi.getMessages(chatId, page)
                NetworkResult.Success(response.messages.map { it.toDomain() })
            } else {
                NetworkResult.Error(message = "No internet connection")
            }
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to get messages")
        }
    }

    override suspend fun sendMessage(
        chatId: String,
        payload: String,
        mediaUrl: String?,
        mediaType: String?,
        replyToId: String?
    ): NetworkResult<ChatMessage> {
        return try {
            if (offlineSyncService.isOnline.value) {
                val response = chatApi.sendMessage(chatId, payload, mediaUrl, mediaType, replyToId)
                NetworkResult.Success(response.message.toDomain())
            } else {
                val localMessage = LocalMessageEntity(
                    id = UUID.randomUUID().toString(),
                    chatId = chatId,
                    senderId = "",
                    payload = payload,
                    mediaUrl = mediaUrl,
                    mediaType = mediaType,
                    replyToId = replyToId,
                    status = "pending"
                )
                
                offlineSyncService.queueMessage(localMessage)
                
                NetworkResult.Success(
                    ChatMessage(
                        id = localMessage.id,
                        chatId = chatId,
                        senderId = "",
                        sender = null,
                        payload = payload,
                        mediaUrl = mediaUrl,
                        mediaType = mediaType,
                        status = "pending",
                        createdAt = Instant.fromEpochMilliseconds(System.currentTimeMillis())
                    )
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error(message = e.message ?: "Failed to send message")
        }
    }

    fun observeConnectivity(): Flow<Boolean> {
        return offlineSyncService.isOnline
    }

    fun cleanup() {
        offlineSyncService.cleanup()
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
