package com.runinga.feature.chat.domain.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.chat.domain.model.Chat
import com.runinga.feature.chat.domain.model.ChatMessage

interface ChatRepository {
    suspend fun getChats(page: Int = 1): NetworkResult<List<Chat>>
    suspend fun getChatById(chatId: String): NetworkResult<Chat>
    suspend fun createDirectChat(recipientId: String): NetworkResult<Chat>
    suspend fun createGroupChat(name: String, description: String, participantIds: List<String>): NetworkResult<Chat>
    suspend fun getMessages(chatId: String, page: Int = 1): NetworkResult<List<ChatMessage>>
    suspend fun sendMessage(chatId: String, payload: String, mediaUrl: String? = null, mediaType: String? = null, replyToId: String? = null, forwardedFromId: String? = null): NetworkResult<ChatMessage>
    suspend fun deleteMessage(messageId: String): NetworkResult<Boolean>
    suspend fun forwardMessage(messageId: String, targetChatId: String): NetworkResult<ChatMessage>
    suspend fun updateGroupChat(chatId: String, name: String? = null, description: String? = null, avatarUrl: String? = null): NetworkResult<Chat>
    suspend fun updateGroup(chatId: String, name: String, description: String?): NetworkResult<Chat>
    suspend fun deleteGroup(chatId: String): NetworkResult<Boolean>
    suspend fun manageMember(chatId: String, userId: String, action: String): NetworkResult<Boolean>
    suspend fun transferOwnership(chatId: String, newOwnerId: String): NetworkResult<Boolean>
    suspend fun leaveGroup(chatId: String): NetworkResult<Boolean>
    suspend fun searchGroups(query: String): NetworkResult<List<Chat>>
    suspend fun sendTypingIndicator(chatId: String, isTyping: Boolean): NetworkResult<Boolean>
}
