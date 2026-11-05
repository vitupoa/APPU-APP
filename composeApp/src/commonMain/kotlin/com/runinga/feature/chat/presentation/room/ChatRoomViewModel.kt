package com.runinga.feature.chat.presentation.room

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.WebSocketService
import com.runinga.com.core.security.TokenManager
import com.runinga.com.core.security.InputValidator
import com.runinga.feature.chat.data.media.ChatMediaUploadService
import com.runinga.feature.chat.data.media.UploadProgress
import com.runinga.feature.chat.data.remote.dto.MessageDto
import com.runinga.feature.chat.domain.ChatEventBus
import com.runinga.feature.chat.domain.ChatEvent
import com.runinga.feature.chat.domain.model.ChatMessage
import com.runinga.feature.chat.domain.model.UserSnippet
import com.runinga.feature.chat.domain.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.datetime.Instant
import kotlinx.serialization.json.Json
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

data class SelectedMedia(
    val uri: String,
    val type: String,
    val fileName: String,
    val fileSize: Long,
    val bytes: ByteArray
)

data class ChatRoomState(
    val messages: List<ChatMessage> = emptyList(),
    val currentUserId: String = "",
    val chatType: com.runinga.feature.chat.domain.model.ChatType? = null,
    val replyingTo: ChatMessage? = null,
    val selectedMessage: ChatMessage? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val typingUsers: List<UserSnippet> = emptyList(),
    val selectedMedia: SelectedMedia? = null,
    val uploadProgress: UploadProgress = UploadProgress.Idle
)

class ChatRoomViewModel(
    private val chatId: String,
    private val repository: ChatRepository,
    private val webSocketService: WebSocketService,
    private val tokenManager: TokenManager,
    private val eventBus: ChatEventBus,
    private val mediaUploadService: ChatMediaUploadService
) : ScreenModel {

    private val _state = MutableStateFlow(ChatRoomState(isLoading = true))
    val state: StateFlow<ChatRoomState> = _state.asStateFlow()

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }
    private var typingJob: Job? = null
    private val typingTimeouts = mutableMapOf<String, Job>()

    init {
        loadCurrentUserId()
        loadChatDetails()
        loadMessages()
        observeWebSocketEvents()
        observeTypingIndicators()
    }

    private fun loadChatDetails() {
        screenModelScope.launch {
            when (val result = repository.getChatById(chatId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(chatType = result.data.type)
                }
                is NetworkResult.Error -> {}
                is NetworkResult.Loading -> {}
            }
        }
    }

    @OptIn(ExperimentalEncodingApi::class)
    private fun loadCurrentUserId() {
        screenModelScope.launch {
            val token = tokenManager.getAccessToken()
            if (token != null) {
                try {
                    val parts = token.split(".")
                    if (parts.size == 3) {
                        val payload = parts[1]
                        val decodedBytes = Base64.UrlSafe.decode(payload)
                        val decodedJson = decodedBytes.decodeToString()
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
            }
        }
    }

    fun sendMessage(payload: String) {
        if (payload.isBlank()) return
        
        try {
            val validatedPayload = InputValidator.validateText(payload, "message")
            
            stopTyping()
            
            val replyToId = _state.value.replyingTo?.id
            
            screenModelScope.launch {
                when (val result = repository.sendMessage(chatId, validatedPayload, replyToId = replyToId)) {
                    is NetworkResult.Success -> {
                        val currentMessages = _state.value.messages.toMutableList()
                        if (currentMessages.none { it.id == result.data.id }) {
                            currentMessages.add(0, result.data)
                            _state.value = _state.value.copy(messages = currentMessages, replyingTo = null)
                        }
                        eventBus.emit(ChatEvent.MessageSent(chatId))
                    }
                    is NetworkResult.Loading -> {}
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(error = "Failed to send message")
                    }
                }
            }
        } catch (e: SecurityException) {
            _state.value = _state.value.copy(error = e.message ?: "Invalid message content")
        }
    }

    fun onMediaSelected(uri: String, type: String, fileName: String, fileSize: Long, bytes: ByteArray) {
        _state.value = _state.value.copy(
            selectedMedia = SelectedMedia(uri, type, fileName, fileSize, bytes),
            uploadProgress = UploadProgress.Idle
        )
    }

    fun sendMediaMessage(caption: String) {
        val media = _state.value.selectedMedia ?: return
        
        try {
            val validatedCaption = if (caption.isNotBlank()) {
                InputValidator.validateText(caption, "caption")
            } else {
                "📎"
            }
            
            screenModelScope.launch {
                mediaUploadService.uploadMedia(
                    chatId = chatId,
                    fileBytes = media.bytes,
                    fileName = media.fileName,
                    mimeType = getMimeType(media.type)
                ).collect { progress ->
                    _state.value = _state.value.copy(uploadProgress = progress)
                    
                    when (progress) {
                        is UploadProgress.Success -> {
                            val replyToId = _state.value.replyingTo?.id
                            when (val result = repository.sendMessage(
                                chatId = chatId,
                                payload = validatedCaption,
                                mediaUrl = progress.url,
                                mediaType = media.type,
                                replyToId = replyToId
                            )) {
                                is NetworkResult.Success -> {
                                    val currentMessages = _state.value.messages.toMutableList()
                                    if (currentMessages.none { it.id == result.data.id }) {
                                        currentMessages.add(0, result.data)
                                        _state.value = _state.value.copy(
                                            messages = currentMessages,
                                            selectedMedia = null,
                                            uploadProgress = UploadProgress.Idle,
                                            replyingTo = null
                                        )
                                    }
                                    eventBus.emit(ChatEvent.MessageSent(chatId))
                                }
                                is NetworkResult.Error -> {
                                    _state.value = _state.value.copy(
                                        uploadProgress = UploadProgress.Error("Failed to send message")
                                    )
                                }
                                is NetworkResult.Loading -> {}
                            }
                        }
                        is UploadProgress.Error -> {
                            // Error state already set
                        }
                        else -> {
                            // Progress updates
                        }
                    }
                }
            }
        } catch (e: SecurityException) {
            _state.value = _state.value.copy(
                error = e.message ?: "Invalid caption content",
                uploadProgress = UploadProgress.Idle
            )
        }
    }

    fun cancelMediaSelection() {
        _state.value = _state.value.copy(
            selectedMedia = null,
            uploadProgress = UploadProgress.Idle
        )
    }

    private fun getMimeType(mediaType: String): String {
        return when (mediaType) {
            "image" -> "image/jpeg"
            "video" -> "video/mp4"
            "document" -> "application/pdf"
            else -> "application/octet-stream"
        }
    }

    fun onTextChanged(text: String) {
        if (text.isNotEmpty()) {
            startTyping()
        } else {
            stopTyping()
        }
    }

    private fun startTyping() {
        typingJob?.cancel()
        typingJob = screenModelScope.launch {
            repository.sendTypingIndicator(chatId, true)
            delay(3000) // Stop typing after 3 seconds of inactivity
            repository.sendTypingIndicator(chatId, false)
        }
    }

    private fun stopTyping() {
        typingJob?.cancel()
        screenModelScope.launch {
            repository.sendTypingIndicator(chatId, false)
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
                        // Emit event to trigger chat list refresh
                        eventBus.emit(ChatEvent.MessageReceived(chatId))
                    }
                } catch (e: Exception) {
                    println("ChatRoomViewModel: Error parsing new message: ${e.message}")
                }
            }
        }
    }

    private fun observeTypingIndicators() {
        screenModelScope.launch {
            webSocketService.chatTypingFlow.collect { payload ->
                try {
                    val typingDto = json.decodeFromString<com.runinga.feature.chat.data.remote.dto.TypingIndicatorDto>(payload)
                    if (typingDto.chatId == chatId) {
                        val user = UserSnippet(
                            typingDto.user.id,
                            typingDto.user.username,
                            typingDto.user.displayName,
                            typingDto.user.avatarUrl
                        )
                        
                        val currentTyping = _state.value.typingUsers.toMutableList()
                        
                        if (typingDto.isTyping) {
                            if (currentTyping.none { it.id == user.id }) {
                                currentTyping.add(user)
                            }
                            
                            // Auto-remove after 5 seconds
                            typingTimeouts[user.id]?.cancel()
                            typingTimeouts[user.id] = screenModelScope.launch {
                                delay(5000)
                                val updated = _state.value.typingUsers.toMutableList()
                                updated.removeAll { it.id == user.id }
                                _state.value = _state.value.copy(typingUsers = updated)
                            }
                        } else {
                            currentTyping.removeAll { it.id == user.id }
                            typingTimeouts[user.id]?.cancel()
                        }
                        
                        _state.value = _state.value.copy(typingUsers = currentTyping)
                    }
                } catch (e: Exception) {
                    println("ChatRoomViewModel: Error parsing typing indicator: ${e.message}")
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
