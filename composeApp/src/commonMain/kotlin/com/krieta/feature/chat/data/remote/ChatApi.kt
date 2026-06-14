package com.krieta.feature.chat.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.chat.data.remote.dto.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
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
        description: String,
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
        replyToId: String? = null,
        forwardedFromId: String? = null
    ): MessageResponseDto {
        return httpClient.post("${ApiConstants.CHAT}/$chatId/messages") {
            setBody(SendMessageRequest(payload, mediaUrl, mediaType, replyToId, forwardedFromId))
        }.body()
    }

    suspend fun deleteMessage(messageId: String): ActionResponse {
        return httpClient.delete("${ApiConstants.CHAT}/messages/$messageId").body()
    }

    suspend fun forwardMessage(messageId: String, targetChatId: String): MessageResponseDto {
        return httpClient.post("${ApiConstants.CHAT}/messages/$messageId/forward") {
            setBody(ForwardMessageRequest(targetChatId))
        }.body()
    }

    suspend fun updateGroupChat(
        chatId: String,
        name: String? = null,
        description: String? = null,
        avatarUrl: String? = null
    ): ChatResponseDto {
        return httpClient.put("${ApiConstants.CHAT}/$chatId") {
            setBody(UpdateGroupChatRequest(name, description, avatarUrl))
        }.body()
    }

    suspend fun manageMember(
        chatId: String,
        userId: String,
        action: String
    ): ActionResponse {
        return httpClient.post("${ApiConstants.CHAT}/$chatId/manage-member") {
            setBody(ManageMemberRequest(userId, action))
        }.body()
    }

    suspend fun transferOwnership(
        chatId: String,
        newOwnerId: String
    ): ActionResponse {
        return httpClient.post("${ApiConstants.CHAT}/$chatId/transfer-ownership") {
            setBody(TransferOwnershipRequest(newOwnerId))
        }.body()
    }

    suspend fun leaveGroup(chatId: String): ActionResponse {
        return httpClient.post("${ApiConstants.CHAT}/$chatId/leave").body()
    }

    suspend fun searchGroups(query: String): ChatListResponseDto {
        return httpClient.get("${ApiConstants.CHAT}/search") {
            parameter("query", query)
            parameter("type", "GROUP")
        }.body()
    }

    suspend fun sendTypingIndicator(chatId: String, isTyping: Boolean): ActionResponse {
        return httpClient.post("${ApiConstants.CHAT}/$chatId/typing") {
            setBody(TypingIndicatorRequest(isTyping))
        }.body()
    }
}

