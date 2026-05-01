package com.krieta.feature.chama.presentation.contribute

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.domain.repository.ChamaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChamaContributeState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val minimumAmount: Double = 0.0,
    val chamaBalance: String = "0"
)

class ChamaContributeViewModel(
    private val chamaId: String,
    private val repository: ChamaRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ChamaContributeState())
    val state: StateFlow<ChamaContributeState> = _state.asStateFlow()

    init {
        loadChamaBalance()
    }

    private fun loadChamaBalance() {
        screenModelScope.launch {
            when (val result = repository.getBalance(chamaId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(chamaBalance = result.data)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun contribute(amount: Double) {
        if (amount <= 0) {
            _state.value = _state.value.copy(error = "Amount must be greater than 0")
            return
        }

        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            when (val result = repository.contribute(chamaId, amount)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        successMessage = "Contribution of $amount Kr successful!"
                    )
                    loadChamaBalance() // Refresh balance
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message ?: "Failed to contribute"
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun clearMessages() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }
}
