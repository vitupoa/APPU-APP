package com.krieta.feature.live.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krieta.feature.live.data.camera.CameraManager
import com.krieta.feature.live.data.socket.LiveSocketEvent
import com.krieta.feature.live.data.socket.LiveSocketManager
import com.krieta.feature.live.data.webrtc.WebRTCManager
import com.krieta.feature.live.data.webrtc.WebRTCState
import com.krieta.feature.live.domain.model.LiveStream
import com.krieta.feature.live.domain.repository.LiveRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class LiveType {
    NORMAL, COMMERCE, BATTLE, MULTI_GUEST
}

data class HostLiveState(
    val isLoading: Boolean = false,
    val isLive: Boolean = false,
    val isPaused: Boolean = false,
    val stream: LiveStream? = null,
    val viewerCount: Int = 0,
    val likesCount: Int = 0,
    val messages: List<ChatMessage> = emptyList(),
    val error: String? = null,
    val liveType: LiveType = LiveType.NORMAL,
    val productId: String? = null,
    val battleOpponentId: String? = null,
    val coHosts: List<CoHost> = emptyList(),
    val hostScore: Double = 0.0,
    val opponentScore: Double = 0.0,
    val isFrontCamera: Boolean = true,
    val webrtcState: WebRTCState = WebRTCState.IDLE
)

data class ChatMessage(
    val id: String,
    val userId: String,
    val username: String,
    val avatarUrl: String?,
    val text: String,
    val isSystem: Boolean = false
)

data class CoHost(
    val id: String,
    val username: String,
    val avatarUrl: String?
)

class HostLiveViewModel(
    private val liveRepository: LiveRepository,
    private val socketManager: LiveSocketManager,
    private val cameraManager: CameraManager,
    private val webrtcManager: WebRTCManager,
    private val liveType: LiveType,
    private val productId: String? = null
) : ViewModel() {

    private val _state = MutableStateFlow(HostLiveState(liveType = liveType, productId = productId))
    val state: StateFlow<HostLiveState> = _state.asStateFlow()

    init {
        observeSocketEvents()
        observeWebRTCState()
    }

    fun startLive(title: String, description: String? = null) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            
            val type = when (liveType) {
                LiveType.NORMAL -> "NORMAL"
                LiveType.COMMERCE -> "COMMERCE"
                LiveType.BATTLE -> "CONTEST_BATTLE"
                LiveType.MULTI_GUEST -> "NORMAL"
            }
            
            liveRepository.startStream(
                title = title,
                description = description,
                type = type,
                isCoHostEnabled = liveType == LiveType.MULTI_GUEST
            ).fold(
                onSuccess = { stream ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isLive = true,
                            stream = stream,
                            viewerCount = stream.viewerCount,
                            likesCount = stream.likesCount
                        )
                    }
                    
                    // Initialize camera
                    cameraManager.initializeCamera(useFrontCamera = true)
                    cameraManager.startCamera()
                    
                    // Initialize WebRTC streaming
                    stream.streamKey?.let { key ->
                        stream.streamUrl?.let { url ->
                            webrtcManager.initialize(key, url)
                            webrtcManager.startStreaming()
                        }
                    }
                    
                    // Connect to socket
                    // socketManager.connect(stream.id, authToken)
                },
                onFailure = { error ->
                    _state.update {
                        it.copy(isLoading = false, error = error.message)
                    }
                }
            )
        }
    }

    fun endLive() {
        viewModelScope.launch {
            val streamId = _state.value.stream?.id ?: return@launch
            
            // Stop camera and streaming
            cameraManager.stopCamera()
            webrtcManager.stopStreaming()
            
            liveRepository.endStream(streamId).fold(
                onSuccess = {
                    _state.update { it.copy(isLive = false) }
                    socketManager.disconnect()
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message) }
                }
            )
        }
    }

    fun sendMessage(text: String) {
        viewModelScope.launch {
            val stream = _state.value.stream ?: return@launch
            // socketManager.sendMessage(text, userId, username, avatarUrl)
            
            // Add message optimistically
            val message = ChatMessage(
                id = "temp_${System.currentTimeMillis()}",
                userId = stream.hostId,
                username = "You",
                avatarUrl = null,
                text = text
            )
            _state.update {
                it.copy(messages = it.messages + message)
            }
        }
    }

    fun sendLike() {
        viewModelScope.launch {
            _state.update {
                it.copy(likesCount = it.likesCount + 1)
            }
            // socketManager.sendLike(userId, username)
        }
    }

    fun switchCamera() {
        viewModelScope.launch {
            cameraManager.switchCamera()
            webrtcManager.switchCamera()
            _state.update {
                it.copy(isFrontCamera = !it.isFrontCamera)
            }
        }
    }

    fun pauseLive() {
        viewModelScope.launch {
            cameraManager.pauseStream()
            webrtcManager.setVideoEnabled(false)
            _state.update {
                it.copy(isPaused = true)
            }
        }
    }

    fun resumeLive() {
        viewModelScope.launch {
            cameraManager.resumeStream()
            webrtcManager.setVideoEnabled(true)
            _state.update {
                it.copy(isPaused = false)
            }
        }
    }

    private fun observeSocketEvents() {
        viewModelScope.launch {
            socketManager.events.collect { event ->
                when (event) {
                    is LiveSocketEvent.MessageReceived -> {
                        val message = ChatMessage(
                            id = event.message.id,
                            userId = event.message.userId,
                            username = event.message.username,
                            avatarUrl = event.message.avatarUrl,
                            text = event.message.text,
                            isSystem = event.message.isSystem
                        )
                        _state.update {
                            it.copy(messages = (it.messages + message).takeLast(50))
                        }
                    }
                    is LiveSocketEvent.ViewerUpdate -> {
                        _state.update {
                            it.copy(viewerCount = event.data.viewerCount)
                        }
                    }
                    is LiveSocketEvent.LikeReceived -> {
                        _state.update {
                            it.copy(likesCount = it.likesCount + event.like.count)
                        }
                    }
                    is LiveSocketEvent.StreamEnded -> {
                        _state.update { it.copy(isLive = false) }
                    }
                    else -> {}
                }
            }
        }
    }
    
    private fun observeWebRTCState() {
        viewModelScope.launch {
            webrtcManager.connectionState.collect { state ->
                _state.update { it.copy(webrtcState = state) }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        viewModelScope.launch {
            cameraManager.release()
            webrtcManager.release()
            socketManager.disconnect()
        }
    }
}
