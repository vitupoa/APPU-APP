package com.krieta.feature.auth.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.auth.data.remote.dto.LoginRequestDto
import com.krieta.feature.auth.domain.model.User
import com.krieta.feature.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    data object Idle : AuthState()
    data object Loading : AuthState()
    data class Success(val user: User) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel(
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    // Login Form State
    var email = MutableStateFlow("")
    var password = MutableStateFlow("")

    fun login() {
        if (email.value.isBlank() || password.value.isBlank()) {
            _authState.value = AuthState.Error("Please enter email and password.")
            return
        }

        screenModelScope.launch {
            _authState.value = AuthState.Loading
            
            val request = LoginRequestDto(
                email = email.value,
                password = password.value,
                deviceId = "TEMP_DEVICE_ID" // Ideally fetched from actual DeviceSecurity Expect/Actual
            )
            
            val result = authRepository.login(request)
            
            _authState.value = when (result) {
                is NetworkResult.Success -> AuthState.Success(result.data)
                is NetworkResult.Error -> AuthState.Error(result.message)
                is NetworkResult.Loading -> AuthState.Loading
            }
        }
    }

    fun resetState() {
        _authState.value = AuthState.Idle
    }
}
