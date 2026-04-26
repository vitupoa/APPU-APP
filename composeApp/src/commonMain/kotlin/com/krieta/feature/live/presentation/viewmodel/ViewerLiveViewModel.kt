package com.krieta.feature.live.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krieta.feature.live.domain.model.LiveMessage
import com.krieta.feature.live.domain.model.LiveStream
import com.krieta.feature.live.domain.repository.LiveRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ViewerLiveState(
    val isLoading: Boolean = true,
    val stream: LiveStream? = null,
    val messages: List<LiveMessage> = emptyList(),
    val viewerCount: Int = 0,
    val likesCount: Int = 0,
    val currentGiftGoal: Double = 0.0,
    val error: String? = null
)

class ViewerLiveViewModel(
    private val liveRepository: LiveRepository,
    private val streamId: String
) : ViewModel() {

    private val _state = MutableStateFlow(ViewerLiveState())
    val state: StateFlow<ViewerLiveState> = _state.asStateFlow()

    init {
        loadStreamDetails()
        connectToSocket()
    }

    private fun loadStreamDetails() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            val result = liveRepository.getStreamDetails(streamId)
            result.onSuccess { stream ->
                _state.update { 
                    it.copy(
                        isLoading = false,
                        stream = stream,
                        viewerCount = stream.viewerCount,
                        likesCount = stream.likesCount,
                        currentGiftGoal = stream.giftGoalCurrent
                    ) 
                }
            }.onFailure { error ->
                _state.update { it.copy(isLoading = false, error = error.message) }
            }
        }
    }

    private fun connectToSocket() {
        // TODO: Implement actual Socket.io connection here.
        // Listen to:
        // - live:new_message -> add to messages list
        // - live:viewer_joined -> update viewerCount
        // - live:viewer_left -> update viewerCount
        // - live:like_burst -> update likesCount
        // - live:tip_received -> show animation, update gift goal
    }

    fun sendMessage(text: String) {
        // TODO: Emit live:message via socket
        viewModelScope.launch {
            val newMessage = LiveMessage(
                id = "temp_${System.currentTimeMillis()}",
                streamId = streamId,
                userId = "currentUserId", // Provide from auth state
                text = text,
                isSystem = false,
                isPinned = false
            )
            _state.update { it.copy(messages = it.messages + newMessage) }
        }
    }

    fun sendLike() {
        // TODO: Emit live:like via socket
        _state.update { it.copy(likesCount = it.likesCount + 1) }
    }

    fun sendTip(amountKr: Double) {
        // TODO: Emit live:tip via socket
    }

    override fun onCleared() {
        super.onCleared()
        // TODO: Disconnect socket
    }
}
