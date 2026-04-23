package com.krieta.feature.chat.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chat.domain.model.Chat
import com.krieta.feature.chat.domain.model.ChatMessage

interface ChatRepository {
    suspend fun getChats(page: Int = 1): NetworkResult<List<Chat>>
    suspend fun createDirectChat(recipientId: String): NetworkResult<Chat>
    suspend fun createGroupChat(name: String, description: String?, participantIds: List<String>): NetworkResult<Chat>
    suspend fun getMessages(chatId: String, page: Int = 1): NetworkResult<List<ChatMessage>>
    suspend fun sendMessage(chatId: String, payload: String, mediaUrl: String? = null, mediaType: String? = null, replyToId: String? = null): NetworkResult<ChatMessage>
}
