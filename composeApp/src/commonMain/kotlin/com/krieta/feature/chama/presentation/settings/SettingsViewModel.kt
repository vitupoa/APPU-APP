package com.krieta.feature.chama.presentation.settings

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.domain.repository.ChamaRepository
import com.krieta.feature.chama.data.remote.dto.UpdateChamaRequest
import com.krieta.feature.chama.data.remote.dto.ChamaDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SettingsState(
    val chama: ChamaDto? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val isUpdating: Boolean = false
)

class SettingsViewModel(
    private val repository: ChamaRepository,
    private val chamaId: String
) : ScreenModel {
    
    private val _state = MutableStateFlow(SettingsState())
    val state: StateFlow<SettingsState> = _state.asStateFlow()
    
    init {
        loadChamaDetails()
    }
    
    private fun loadChamaDetails() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getChamaById(chamaId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        chama = result.data,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
            }
        }
    }
    
    fun updateChama(
        name: String? = null,
        description: String? = null,
        contributionAmountKr: Double? = null,
        penaltyAmountKr: Double? = null,
        gracePeriodDays: Int? = null,
        maxMembers: Int? = null,
        isLocked: Boolean? = null
    ) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isUpdating = true, error = null)
            
            val request = UpdateChamaRequest(
                name = name,
                description = description,
                contributionAmountKr = contributionAmountKr,
                penaltyAmountKr = penaltyAmountKr,
                gracePeriodDays = gracePeriodDays,
                maxMembers = maxMembers,
                isLocked = isLocked
            )
            
            when (repository.updateChama(chamaId, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isUpdating = false,
                        successMessage = "Chama settings updated successfully"
                    )
                    loadChamaDetails()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isUpdating = false,
                        error = "Failed to update chama settings"
                    )
                }
            }
        }
    }
    
    fun removeMember(memberUserId: String, reason: String) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isUpdating = true, error = null)
            
            when (repository.removeMember(chamaId, memberUserId, reason)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isUpdating = false,
                        successMessage = "Member removed successfully"
                    )
                    loadChamaDetails()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isUpdating = false,
                        error = "Failed to remove member"
                    )
                }
            }
        }
    }
    
    fun leaveChama() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isUpdating = true, error = null)
            
            when (repository.leaveChama(chamaId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isUpdating = false,
                        successMessage = "Left chama successfully"
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isUpdating = false,
                        error = "Failed to leave chama"
                    )
                }
            }
        }
    }
    
    fun clearMessages() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }
}
