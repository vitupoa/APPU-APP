package com.krieta.feature.chat.presentation.room

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.WebSocketService
import com.krieta.com.core.security.TokenManager
import com.krieta.feature.chat.data.remote.dto.MessageDto
import com.krieta.feature.chat.domain.model.ChatMessage
import com.krieta.feature.chat.domain.model.UserSnippet
import com.krieta.feature.chat.domain.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Instant
import kotlinx.serialization.json.Json

data class ChatRoomState(
    val messages: List<ChatMessage> = emptyList(),
    val currentUserId: String = "",
    val replyingTo: ChatMessage? = null,
    val selectedMessage: ChatMessage? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

class ChatRoomViewModel(
    private val chatId: String,
    private val repository: ChatRepository,
    private val webSocketService: WebSocketService,
    private val tokenManager: TokenManager
) : ScreenModel {

    private val _state = MutableStateFlow(ChatRoomState(isLoading = true))
    val state: StateFlow<ChatRoomState> = _state.asStateFlow()

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    init {
        loadCurrentUserId()
        loadMessages()
        observeWebSocketEvents()
    }

    private fun loadCurrentUserId() {
        screenModelScope.launch {
            val token = tokenManager.getAccessToken()
            if (token != null) {
                try {
                    val parts = token.split(".")
                    if (parts.size == 3) {
                        val payload = parts[1]
                        val decodedJson = payload.decodeBase64()?.decodeToString() ?: ""
                        val userId = decodedJson.substringAfter("\"userId\":\"").substringBefore("\"")
                        _state.value = _state.value.copy(currentUserId = userId)
                    }
                } catch (e: Exception) {
                    println("Error decoding token: ${e.message}")
                }
            }
        }
    }

    private fun loadMessages() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.getMessages(chatId, page = 1)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(messages = result.data, isLoading = false)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun sendMessage(payload: String) {
        if (payload.isBlank()) return
        
        val replyToId = _state.value.replyingTo?.id
        
        screenModelScope.launch {
            when (val result = repository.sendMessage(chatId, payload, replyToId = replyToId)) {
                is NetworkResult.Success -> {
                    val currentMessages = _state.value.messages.toMutableList()
                    if (currentMessages.none { it.id == result.data.id }) {
                        currentMessages.add(0, result.data)
                        _state.value = _state.value.copy(messages = currentMessages, replyingTo = null)
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = "Failed to send message")
                }
            }
        }
    }

    fun setReplyTo(message: ChatMessage?) {
        _state.value = _state.value.copy(replyingTo = message)
    }

    fun deleteMessage(messageId: String) {
        screenModelScope.launch {
            when (repository.deleteMessage(messageId)) {
                is NetworkResult.Success -> {
                    val currentMessages = _state.value.messages.toMutableList()
                    currentMessages.removeAll { it.id == messageId }
                    _state.value = _state.value.copy(messages = currentMessages)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = "Failed to delete message")
                }
            }
        }
    }

    fun forwardMessage(messageId: String, targetChatId: String) {
        screenModelScope.launch {
            when (repository.forwardMessage(messageId, targetChatId)) {
                is NetworkResult.Success -> {
                    // Success feedback
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = "Failed to forward message")
                }
            }
        }
    }

    private fun observeWebSocketEvents() {
        screenModelScope.launch {
            webSocketService.chatNewMessageFlow.collect { payload ->
                try {
                    val messageDto = json.decodeFromString<MessageDto>(payload)
                    if (messageDto.chatId == chatId) {
                        val currentMessages = _state.value.messages.toMutableList()
                        if (currentMessages.none { it.id == messageDto.id }) {
                            currentMessages.add(0, mapMessageDto(messageDto))
                            _state.value = _state.value.copy(messages = currentMessages)
                        }
                    }
                } catch (e: Exception) {
                    println("ChatRoomViewModel: Error parsing new message: ${e.message}")
                }
            }
        }
    }

    private fun mapMessageDto(dto: MessageDto): ChatMessage {
        return ChatMessage(
            id = dto.id,
            chatId = dto.chatId,
            senderId = dto.senderId,
            sender = dto.sender?.let { UserSnippet(it.id, it.username, it.displayName, it.avatarUrl) },
            payload = dto.payload,
            mediaUrl = dto.mediaUrl,
            mediaType = dto.mediaType,
            isSystemEvent = dto.isSystemEvent,
            status = dto.status,
            createdAt = try { Instant.parse(dto.createdAt) } catch (e: Exception) { Instant.DISTANT_PAST }
        )
    }
}
