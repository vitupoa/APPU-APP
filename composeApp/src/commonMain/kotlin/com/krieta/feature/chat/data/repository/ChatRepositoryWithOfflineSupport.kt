package com.krieta.feature.chat.data.repository

import com.krieta.feature.chat.data.local.LocalMessage
import com.krieta.feature.chat.data.local.MessageStatus
import com.krieta.feature.chat.data.local.OfflineMessageSyncService
import com.krieta.feature.chat.data.local.toEntity
import com.krieta.feature.chat.data.remote.ChatApi
import com.krieta.feature.chat.domain.model.Chat
import com.krieta.feature.chat.domain.model.Message
import com.krieta.feature.chat.domain.repository.ChatRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

class ChatRepositoryWithOfflineSupport(
    private val chatApi: ChatApi,
    private val offlineSyncService: OfflineMessageSyncService
) : ChatRepository {

    override suspend fun getChats(page: Int, limit: Int): Result<List<Chat>> {
        return try {
            if (offlineSyncService.isOnline.value) {
                chatApi.getChats(page, limit)
            } else {
                Result.failure(Exception("No internet connection"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getChatById(chatId: String): Result<Chat> {
        return try {
            if (offlineSyncService.isOnline.value) {
                chatApi.getChatById(chatId)
            } else {
                Result.failure(Exception("No internet connection"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createDirectChat(recipientId: String): Result<Chat> {
        return try {
            if (offlineSyncService.isOnline.value) {
                chatApi.createDirectChat(recipientId)
            } else {
                Result.failure(Exception("No internet connection"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createGroupChat(
        name: String,
        description: String?,
        participantIds: List<String>
    ): Result<Chat> {
        return try {
            if (offlineSyncService.isOnline.value) {
                chatApi.createGroupChat(name, description, participantIds)
            } else {
                Result.failure(Exception("No internet connection"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getMessages(chatId: String, page: Int, limit: Int): Result<List<Message>> {
        return try {
            if (offlineSyncService.isOnline.value) {
                chatApi.getMessages(chatId, page, limit)
            } else {
                Result.failure(Exception("No internet connection"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun sendMessage(
        chatId: String,
        payload: String,
        mediaUrl: String?,
        mediaType: String?,
        replyToId: String?
    ): Result<Message> {
        return try {
            if (offlineSyncService.isOnline.value) {
                // Online: send directly
                chatApi.sendMessage(chatId, payload, mediaUrl, mediaType, replyToId)
            } else {
                // Offline: queue message
                val localMessage = LocalMessage(
                    id = UUID.randomUUID().toString(),
                    chatId = chatId,
                    senderId = "", // Will be set by sync service
                    payload = payload,
                    mediaUrl = mediaUrl,
                    mediaType = mediaType,
                    replyToId = replyToId,
                    status = MessageStatus.PENDING
                )
                
                offlineSyncService.queueMessage(localMessage.toEntity())
                
                // Return optimistic result
                Result.success(
                    Message(
                        id = localMessage.id,
                        chatId = chatId,
                        senderId = "",
                        payload = payload,
                        mediaUrl = mediaUrl,
                        mediaType = mediaType,
                        status = "pending",
                        createdAt = System.currentTimeMillis()
                    )
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun sendTip(
        chatId: String,
        recipientId: String,
        amountKr: Int,
        currency: String
    ): Result<Unit> {
        return try {
            if (offlineSyncService.isOnline.value) {
                chatApi.sendTip(chatId, recipientId, amountKr, currency)
            } else {
                Result.failure(Exception("Tipping requires internet connection"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun observeConnectivity(): Flow<Boolean> {
        return offlineSyncService.isOnline
    }

    fun cleanup() {
        offlineSyncService.cleanup()
    }
}
