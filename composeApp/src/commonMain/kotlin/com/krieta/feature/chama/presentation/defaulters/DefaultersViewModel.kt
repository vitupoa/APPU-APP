package com.krieta.feature.chama.presentation.defaulters

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.domain.repository.ChamaRepository
import com.krieta.feature.chama.data.remote.dto.ChamaDefaulterDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DefaultersState(
    val defaulters: List<ChamaDefaulterDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isRefreshing: Boolean = false
)

class DefaultersViewModel(
    private val repository: ChamaRepository
) : ScreenModel {
    
    private val _state = MutableStateFlow(DefaultersState())
    val state: StateFlow<DefaultersState> = _state.asStateFlow()
    
    init {
        loadDefaulters()
    }
    
    fun loadDefaulters() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getDefaulters()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        defaulters = result.data,
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
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun refresh() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isRefreshing = true)
            
            when (val result = repository.getDefaulters()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        defaulters = result.data,
                        isRefreshing = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isRefreshing = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun resolveDefault(defaultId: String) {
        screenModelScope.launch {
            when (repository.resolveDefault(defaultId)) {
                is NetworkResult.Success -> {
                    // Remove from list
                    _state.value = _state.value.copy(
                        defaulters = _state.value.defaulters.filter { it.id != defaultId }
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        error = "Failed to resolve default"
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
