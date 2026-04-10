package com.krieta.feature.auth.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.auth.data.remote.dto.RegisterRequestDto
import com.krieta.feature.auth.domain.model.User
import com.krieta.feature.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class RegisterState {
    data object Idle : RegisterState()
    data object Loading : RegisterState()
    data class Success(val user: User) : RegisterState()
    data class Error(val message: String) : RegisterState()
}

class RegisterViewModel(
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _registerState = MutableStateFlow<RegisterState>(RegisterState.Idle)
    val registerState: StateFlow<RegisterState> = _registerState.asStateFlow()

    // Form fields
    var accountType = MutableStateFlow("CREATOR")
    var firstName = MutableStateFlow("")
    var lastName = MutableStateFlow("")
    var username = MutableStateFlow("")
    var email = MutableStateFlow("")
    var password = MutableStateFlow("")

    fun register() {
        if (firstName.value.isBlank() || lastName.value.isBlank() || username.value.isBlank() ||
            email.value.isBlank() || password.value.isBlank()) {
            _registerState.value = RegisterState.Error("Please fill out all fields")
            return
        }

        screenModelScope.launch {
            _registerState.value = RegisterState.Loading
            
            val request = RegisterRequestDto(
                email = email.value.trim(),
                password = password.value,
                firstName = firstName.value.trim(),
                lastName = lastName.value.trim(),
                username = username.value.trim(),
                accountType = accountType.value,
                country = "US", // Placeholder - real implementation uses LocationProvider
                currency = "USD", // Placeholder - real implementation uses LocationProvider
                deviceId = "TEMP_DEVICE_ID"
            )
            
            val result = authRepository.register(request)
            
            _registerState.value = when (result) {
                is NetworkResult.Success -> RegisterState.Success(result.data)
                is NetworkResult.Error -> RegisterState.Error(result.message)
                is NetworkResult.Loading -> RegisterState.Loading
            }
        }
    }
}
