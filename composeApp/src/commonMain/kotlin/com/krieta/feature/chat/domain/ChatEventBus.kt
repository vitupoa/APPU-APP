package com.krieta.feature.chat.domain

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

sealed class ChatEvent {
    data class MessageSent(val chatId: String) : ChatEvent()
    data class MessageReceived(val chatId: String) : ChatEvent()
}

class ChatEventBus {
    private val _events = MutableSharedFlow<ChatEvent>(replay = 0)
    val events = _events.asSharedFlow()

    suspend fun emit(event: ChatEvent) {
        _events.emit(event)
    }
}
