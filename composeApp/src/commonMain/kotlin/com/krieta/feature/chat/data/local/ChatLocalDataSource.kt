package com.krieta.feature.chat.data.local

import com.krieta.com.db.KrietaDatabase
import com.krieta.feature.chat.domain.model.Conversation
import com.krieta.feature.chat.domain.model.Message
import com.krieta.feature.chat.domain.model.ChatUser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class ChatLocalDataSource(private val database: KrietaDatabase) {
    
    private val conversationQueries = database.conversationQueries
    private val messageQueries = database.messageQueries
    
    suspend fun cacheConversations(conversations: List<Conversation>) = withContext(Dispatchers.IO) {
        conversations.forEach { conversation ->
            conversationQueries.insertOrReplaceConversation(
                id = conversation.id,
                otherUserId = conversation.otherUser.id,
                otherUsername = conversation.otherUser.username,
                otherDisplayName = conversation.otherUser.displayName,
                otherAvatarUrl = conversation.otherUser.avatarUrl,
                lastMessageContent = conversation.lastMessage?.content,
                lastMessageSenderId = conversation.lastMessage?.senderId,
                lastMessageTimestamp = conversation.lastMessage?.timestamp,
                unreadCount = conversation.unreadCount.toLong(),
                isOnline = conversation.otherUser.isOnline,
                updatedAt = conversation.updatedAt,
                cachedAt = System.currentTimeMillis()
            )
        }
    }
    
    suspend fun getCachedConversations(): List<Conversation> = withContext(Dispatchers.IO) {
        conversationQueries.getAllConversations().executeAsList().map { entity ->
            Conversation(
                id = entity.id,
                otherUser = ChatUser(
                    id = entity.otherUserId,
                    username = entity.otherUsername,
                    displayName = entity.otherDisplayName,
                    avatarUrl = entity.otherAvatarUrl,
                    isOnline = entity.isOnline
                ),
                lastMessage = if (entity.lastMessageContent != null) {
                    Message(
                        id = "",
                        conversationId = entity.id,
                        senderId = entity.lastMessageSenderId ?: "",
                        content = entity.lastMessageContent,
                        timestamp = entity.lastMessageTimestamp ?: "",
                        isRead = true,
                        messageType = "TEXT"
                    )
                } else null,
                unreadCount = entity.unreadCount.toInt(),
                updatedAt = entity.updatedAt
            )
        }
    }
    
    suspend fun cacheMessages(conversationId: String, messages: List<Message>) = withContext(Dispatchers.IO) {
        messages.forEach { message ->
            messageQueries.insertOrReplaceMessage(
                id = message.id,
                conversationId = conversationId,
                senderId = message.senderId,
                senderUsername = message.senderUsername ?: "",
                senderDisplayName = message.senderDisplayName ?: "",
                senderAvatarUrl = message.senderAvatarUrl,
                content = message.content,
                messageType = message.messageType,
                mediaUrl = message.mediaUrl,
                isRead = message.isRead,
                createdAt = message.timestamp,
                cachedAt = System.currentTimeMillis()
            )
        }
    }
    
    suspend fun getCachedMessages(conversationId: String): List<Message> = withContext(Dispatchers.IO) {
        messageQueries.getMessagesByConversationId(conversationId).executeAsList().map { entity ->
            Message(
                id = entity.id,
                conversationId = entity.conversationId,
                senderId = entity.senderId,
                senderUsername = entity.senderUsername,
                senderDisplayName = entity.senderDisplayName,
                senderAvatarUrl = entity.senderAvatarUrl,
                content = entity.content,
                messageType = entity.messageType,
                mediaUrl = entity.mediaUrl,
                isRead = entity.isRead,
                timestamp = entity.createdAt
            )
        }
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        messageQueries.deleteMessagesByConversationId("")
        conversationQueries.deleteAllConversations()
    }
}
