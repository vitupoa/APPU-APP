package com.krieta.com.core.session

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class SessionManager {
    private val _sessionExpired = MutableSharedFlow<Unit>(replay = 0)
    val sessionExpired: SharedFlow<Unit> = _sessionExpired.asSharedFlow()

    suspend fun notifySessionExpired() {
        _sessionExpired.emit(Unit)
    }
}
