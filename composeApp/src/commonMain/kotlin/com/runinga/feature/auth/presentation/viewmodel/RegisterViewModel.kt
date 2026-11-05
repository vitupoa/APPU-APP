package com.runinga.feature.auth.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.auth.data.remote.dto.RegisterRequestDto
import com.runinga.feature.auth.domain.model.User
import com.runinga.feature.auth.domain.repository.AuthRepository
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
    private val authRepository: AuthRepository,
    private val locationProvider: com.runinga.com.core.location.LocationProvider
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
    var selectedNiches = MutableStateFlow<List<String>>(emptyList())
    var customNiches = MutableStateFlow<List<String>>(emptyList())

    fun addNiche(niche: String) {
        val current = selectedNiches.value
        if (!current.contains(niche)) {
            selectedNiches.value = current + niche
        }
    }
    
    fun removeNiche(niche: String) {
        selectedNiches.value = selectedNiches.value.filter { it != niche }
        customNiches.value = customNiches.value.filter { it != niche }
    }
    
    fun addCustomNiche(niche: String) {
        val current = customNiches.value
        if (!current.contains(niche) && niche.isNotBlank()) {
            customNiches.value = current + niche
        }
    }

    fun register() {
        if (firstName.value.isBlank() || lastName.value.isBlank() || username.value.isBlank() ||
            email.value.isBlank() || password.value.isBlank()) {
            _registerState.value = RegisterState.Error("Please fill out all fields")
            return
        }
        
        if (selectedNiches.value.isEmpty() && customNiches.value.isEmpty()) {
            _registerState.value = RegisterState.Error("Please select at least one niche")
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
                country = locationProvider.getCurrentCountry(),
                currency = locationProvider.getCurrentCurrency(),
                deviceId = "TEMP_DEVICE_ID", // Ideally bound locally
                selectedNiches = selectedNiches.value,
                customNiches = customNiches.value
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
