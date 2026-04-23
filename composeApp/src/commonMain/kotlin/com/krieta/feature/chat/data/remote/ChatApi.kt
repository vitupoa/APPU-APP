package com.krieta.feature.chat.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.chat.data.remote.dto.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class ChatApi(private val httpClient: HttpClient) {

    suspend fun getChats(page: Int = 1, limit: Int = 20): ChatListResponseDto {
        return httpClient.get(ApiConstants.CHAT) {
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    suspend fun createDirectChat(recipientId: String): ChatResponseDto {
        return httpClient.post("${ApiConstants.CHAT}/direct") {
            setBody(CreateDirectChatRequest(recipientId))
        }.body()
    }

    suspend fun createGroupChat(
        name: String,
        description: String? = null,
        participantIds: List<String>
    ): ChatResponseDto {
        return httpClient.post("${ApiConstants.CHAT}/group") {
            setBody(CreateGroupChatRequest(name, description, participantIds))
        }.body()
    }

    suspend fun getMessages(chatId: String, page: Int = 1, limit: Int = 50): MessageListResponseDto {
        return httpClient.get("${ApiConstants.CHAT}/$chatId/messages") {
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    suspend fun sendMessage(
        chatId: String,
        payload: String,
        mediaUrl: String? = null,
        mediaType: String? = null,
        replyToId: String? = null
    ): MessageResponseDto {
        return httpClient.post("${ApiConstants.CHAT}/$chatId/messages") {
            setBody(SendMessageRequest(payload, mediaUrl, mediaType, replyToId))
        }.body()
    }
}
