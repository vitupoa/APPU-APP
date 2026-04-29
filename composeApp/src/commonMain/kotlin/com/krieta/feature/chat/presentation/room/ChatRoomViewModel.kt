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
        // Simple way to get the current user ID - decode from JWT in production or fetch from profile cache
        // For now, we'll leave it empty and let the UI check senderId
        loadMessages()
        observeWebSocketEvents()
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
        
        screenModelScope.launch {
            when (val result = repository.sendMessage(chatId, payload)) {
                is NetworkResult.Success -> {
                    // Message will also come via WebSocket, but we can optimistically add it here
                    val currentMessages = _state.value.messages.toMutableList()
                    // Check if it's already there to avoid duplicates
                    if (currentMessages.none { it.id == result.data.id }) {
                        currentMessages.add(0, result.data)
                        _state.value = _state.value.copy(messages = currentMessages)
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    // Handle error (e.g. show toast)
                    _state.value = _state.value.copy(error = "Failed to send message")
                }
                is NetworkResult.Loading -> {}
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
