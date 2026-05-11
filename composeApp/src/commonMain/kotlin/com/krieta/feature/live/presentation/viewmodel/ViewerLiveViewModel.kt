package com.krieta.feature.live.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.live.data.socket.LiveSocketEvent
import com.krieta.feature.live.data.socket.LiveSocketManager
import com.krieta.feature.live.domain.model.LiveMessage
import com.krieta.feature.live.domain.model.LiveStream
import com.krieta.feature.live.domain.repository.LiveRepository
import com.krieta.feature.wallet.domain.repository.WalletRepository
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
    val showTipAnimation: Boolean = false,
    val lastTipAmount: Double = 0.0,
    val lastTipSender: String = "",
    val isTipping: Boolean = false,
    val tipError: String? = null,
    val error: String? = null
)

class ViewerLiveViewModel(
    private val liveRepository: LiveRepository,
    private val socketManager: LiveSocketManager,
    private val walletRepository: WalletRepository,
    val currencyProvider: UserCurrencyProvider,
    private val streamId: String,
    private val tokenManager: com.krieta.com.core.security.TokenManager,
    private val currentUserId: String,
    private val currentUsername: String,
    private val currentUserAvatar: String?
) : ViewModel() {

    private val _state = MutableStateFlow(ViewerLiveState())
    val state: StateFlow<ViewerLiveState> = _state.asStateFlow()

    init {
        loadStreamDetails()
        connectToSocket()
        observeSocketEvents()
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
        viewModelScope.launch {
            val authToken = tokenManager.getAccessToken() ?: ""
            socketManager.connect(streamId, authToken)
        }
    }

    private fun observeSocketEvents() {
        viewModelScope.launch {
            socketManager.events.collect { event ->
                when (event) {
                    is LiveSocketEvent.Connected -> {
                        // Connection successful
                    }
                    is LiveSocketEvent.MessageReceived -> {
                        val message = LiveMessage(
                            id = event.message.id,
                            streamId = streamId,
                            userId = event.message.userId,
                            text = event.message.text,
                            isSystem = event.message.isSystem,
                            isPinned = event.message.isPinned
                        )
                        _state.update { it.copy(messages = it.messages + message) }
                    }
                    is LiveSocketEvent.ViewerUpdate -> {
                        _state.update { it.copy(viewerCount = event.data.viewerCount) }
                    }
                    is LiveSocketEvent.TipReceived -> {
                        _state.update { 
                            it.copy(
                                currentGiftGoal = it.currentGiftGoal + event.tip.amountKr,
                                showTipAnimation = true,
                                lastTipAmount = event.tip.amountKr,
                                lastTipSender = event.tip.senderName
                            )
                        }
                        // Hide animation after 3 seconds
                        viewModelScope.launch {
                            kotlinx.coroutines.delay(3000)
                            _state.update { it.copy(showTipAnimation = false) }
                        }
                    }
                    is LiveSocketEvent.LikeReceived -> {
                        _state.update { it.copy(likesCount = it.likesCount + event.like.count) }
                    }
                    is LiveSocketEvent.StreamEnded -> {
                        _state.update { it.copy(error = "Stream has ended") }
                    }
                    is LiveSocketEvent.Disconnected -> {
                        _state.update { it.copy(error = "Disconnected: ${event.reason}") }
                    }
                    is LiveSocketEvent.Error -> {
                        _state.update { it.copy(error = event.message) }
                    }
                }
            }
        }
    }

    fun sendMessage(text: String) {
        viewModelScope.launch {
            socketManager.sendMessage(text, currentUserId, currentUsername, currentUserAvatar)
        }
    }

    fun sendLike() {
        viewModelScope.launch {
            socketManager.sendLike(currentUserId, currentUsername)
            _state.update { it.copy(likesCount = it.likesCount + 1) }
        }
    }

    /**
     * Send tip via the wallet REST API (same system used by Drips/Shorts).
     * The wallet backend handles deduction, credit, platform fee, and transaction recording.
     */
    fun sendTip(krAmount: Int) {
        val stream = _state.value.stream ?: return
        viewModelScope.launch {
            _state.update { it.copy(isTipping = true, tipError = null) }
            when (val result = walletRepository.sendTip(
                recipientId = stream.hostId,
                krAmount = krAmount,
                currency = currencyProvider.currencyCode
            )) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isTipping = false) }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isTipping = false, tipError = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        viewModelScope.launch {
            socketManager.disconnect()
        }
    }
}
