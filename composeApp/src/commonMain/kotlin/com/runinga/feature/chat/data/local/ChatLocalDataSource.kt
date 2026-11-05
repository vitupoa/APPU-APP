package com.runinga.feature.chat.data.local

import com.runinga.db.RuningaDatabase
import com.runinga.feature.chat.domain.model.Chat
import com.runinga.feature.chat.domain.model.ChatMessage
import com.runinga.feature.chat.domain.model.ChatParticipant
import com.runinga.feature.chat.domain.model.ChatType
import com.runinga.feature.chat.domain.model.UserSnippet
import com.runinga.com.core.util.currentTimeMillis
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import kotlinx.datetime.Instant

class ChatLocalDataSource(private val database: RuningaDatabase) {

    private val chatQueries = database.chatQueries

    suspend fun cacheChats(chats: List<Chat>) = withContext(Dispatchers.IO) {
        chats.forEach { chat ->
            val otherParticipant = chat.participants.firstOrNull()?.user
            val latest = chat.latestMessage
            chatQueries.insertOrReplaceConversation(
                id = chat.id,
                otherUserId = otherParticipant?.id ?: "",
                otherUsername = otherParticipant?.username ?: "",
                otherDisplayName = otherParticipant?.displayName ?: "",
                otherAvatarUrl = otherParticipant?.avatarUrl,
                lastMessageContent = latest?.payload,
                lastMessageSenderId = latest?.senderId,
                lastMessageTimestamp = latest?.createdAt?.toString(),
                unreadCount = 0L,
                isOnline = 0L,
                updatedAt = chat.updatedAt.toString(),
                cachedAt = currentTimeMillis()
            )
        }
    }

    suspend fun getCachedChats(): List<Chat> = withContext(Dispatchers.IO) {
        chatQueries.getAllConversations().executeAsList().map { entity ->
            val otherUser = UserSnippet(
                id = entity.otherUserId,
                username = entity.otherUsername,
                displayName = entity.otherDisplayName,
                avatarUrl = entity.otherAvatarUrl
            )
            Chat(
                id = entity.id,
                type = ChatType.DIRECT,
                participants = listOf(
                    ChatParticipant(
                        userId = entity.otherUserId,
                        role = "member",
                        joinedAt = Instant.fromEpochMilliseconds(0),
                        user = otherUser
                    )
                ),
                latestMessage = entity.lastMessageContent?.let {
                    ChatMessage(
                        id = "",
                        chatId = entity.id,
                        senderId = entity.lastMessageSenderId ?: "",
                        sender = null,
                        payload = it,
                        createdAt = entity.lastMessageTimestamp
                            ?.let { ts -> runCatching { Instant.parse(ts) }.getOrNull() }
                            ?: Instant.fromEpochMilliseconds(0)
                    )
                },
                createdAt = Instant.fromEpochMilliseconds(0),
                updatedAt = runCatching { Instant.parse(entity.updatedAt) }.getOrElse { Instant.fromEpochMilliseconds(0) }
            )
        }
    }

    suspend fun cacheMessages(chatId: String, messages: List<ChatMessage>) = withContext(Dispatchers.IO) {
        messages.forEach { message ->
            chatQueries.insertOrReplaceMessage(
                id = message.id,
                conversationId = chatId,
                senderId = message.senderId,
                senderUsername = message.sender?.username ?: "",
                senderDisplayName = message.sender?.displayName ?: "",
                senderAvatarUrl = message.sender?.avatarUrl,
                content = message.payload,
                messageType = message.mediaType ?: "TEXT",
                mediaUrl = message.mediaUrl,
                isRead = 0L,
                createdAt = message.createdAt.toString(),
                cachedAt = currentTimeMillis()
            )
        }
    }

    suspend fun getCachedMessages(chatId: String): List<ChatMessage> = withContext(Dispatchers.IO) {
        chatQueries.getMessagesByConversationId(chatId).executeAsList().map { entity ->
            ChatMessage(
                id = entity.id,
                chatId = entity.conversationId,
                senderId = entity.senderId,
                sender = UserSnippet(
                    id = entity.senderId,
                    username = entity.senderUsername,
                    displayName = entity.senderDisplayName,
                    avatarUrl = entity.senderAvatarUrl
                ),
                payload = entity.content,
                mediaUrl = entity.mediaUrl,
                mediaType = entity.messageType,
                createdAt = runCatching { Instant.parse(entity.createdAt) }.getOrElse { Instant.fromEpochMilliseconds(0) }
            )
        }
    }

    suspend fun clearCache() = withContext(Dispatchers.IO) {
        chatQueries.deleteAllConversations()
    }
}
