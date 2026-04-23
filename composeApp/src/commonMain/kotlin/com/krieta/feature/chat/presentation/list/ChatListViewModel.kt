package com.krieta.feature.chat.presentation.list

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.WebSocketService
import com.krieta.feature.chat.data.remote.dto.ChatDto
import com.krieta.feature.chat.data.remote.dto.MessageDto
import com.krieta.feature.chat.domain.model.Chat
import com.krieta.feature.chat.domain.model.ChatMessage
import com.krieta.feature.chat.domain.model.ChatParticipant
import com.krieta.feature.chat.domain.model.ChatType
import com.krieta.feature.chat.domain.model.UserSnippet
import com.krieta.feature.chat.domain.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Instant
import kotlinx.serialization.json.Json

data class ChatListState(
    val chats: List<Chat> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class ChatListViewModel(
    private val repository: ChatRepository,
    private val webSocketService: WebSocketService
) : ScreenModel {

    private val _state = MutableStateFlow(ChatListState(isLoading = true))
    val state: StateFlow<ChatListState> = _state.asStateFlow()

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    init {
        loadChats()
        observeWebSocketEvents()
    }

    private fun loadChats() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.getChats()) {
                is NetworkResult.Success -> {
                    _state.value = ChatListState(chats = result.data, isLoading = false)
                }
                is NetworkResult.Error -> {
                    _state.value = ChatListState(isLoading = false, error = result.message)
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
                    handleNewMessage(messageDto)
                } catch (e: Exception) {
                    println("ChatListViewModel: Error parsing new message payload: ${e.message}")
                }
            }
        }

        screenModelScope.launch {
            webSocketService.chatNewChatFlow.collect { payload ->
                try {
                    val chatDto = json.decodeFromString<ChatDto>(payload)
                    handleNewChat(chatDto)
                } catch (e: Exception) {
                    println("ChatListViewModel: Error parsing new chat payload: ${e.message}")
                }
            }
        }
    }

    private fun handleNewMessage(messageDto: MessageDto) {
        val currentChats = _state.value.chats.toMutableList()
        val index = currentChats.indexOfFirst { it.id == messageDto.chatId }

        if (index != -1) {
            val chat = currentChats[index]
            val updatedChat = chat.copy(
                latestMessage = mapMessageDto(messageDto),
                updatedAt = try { Instant.parse(messageDto.createdAt) } catch (e: Exception) { chat.updatedAt }
            )
            currentChats.removeAt(index)
            currentChats.add(0, updatedChat) // Move to top
            _state.value = _state.value.copy(chats = currentChats)
        } else {
            // New message for an unknown chat. Reload chats to fetch the new chat data.
            loadChats()
        }
    }

    private fun handleNewChat(chatDto: ChatDto) {
        // To simplify, just map and add to top. In a real scenario, you'd map ChatDto -> Chat directly in repo.
        loadChats() // Quickest sync pattern for new chats
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
