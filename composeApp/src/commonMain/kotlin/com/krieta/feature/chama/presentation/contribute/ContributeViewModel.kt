package com.krieta.feature.chama.presentation.contribute

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.domain.repository.ChamaRepository
import com.krieta.feature.chama.data.remote.dto.ChamaTransactionDto
import com.krieta.feature.chama.data.remote.dto.ChamaBalanceDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ContributeState(
    val balance: ChamaBalanceDto? = null,
    val transactions: List<ChamaTransactionDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val isSubmitting: Boolean = false,
    val currentPage: Int = 1,
    val hasMore: Boolean = true
)

class ContributeViewModel(
    private val repository: ChamaRepository,
    private val chamaId: String
) : ScreenModel {
    
    private val _state = MutableStateFlow(ContributeState())
    val state: StateFlow<ContributeState> = _state.asStateFlow()
    
    init {
        loadBalance()
        loadTransactions()
    }
    
    private fun loadBalance() {
        screenModelScope.launch {
            when (val result = repository.getBalance(chamaId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(balance = result.data as? ChamaBalanceDto)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    private fun loadTransactions(page: Int = 1) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getTransactions(chamaId, page)) {
                is NetworkResult.Success -> {
                    val newTransactions = if (page == 1) {
                        result.data.transactions
                    } else {
                        _state.value.transactions + result.data.transactions
                    }
                    
                    _state.value = _state.value.copy(
                        transactions = newTransactions,
                        isLoading = false,
                        currentPage = page,
                        hasMore = result.data.transactions.isNotEmpty()
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
    
    fun contribute(amountKr: Double) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isSubmitting = true, error = null)
            
            when (repository.contribute(chamaId, amountKr)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        successMessage = "Contribution of ${amountKr} Kr successful"
                    )
                    loadBalance()
                    loadTransactions(1) // Reload from first page
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        error = "Failed to make contribution"
                    )
                }
            }
        }
    }
    
    fun loadMore() {
        if (!_state.value.isLoading && _state.value.hasMore) {
            loadTransactions(_state.value.currentPage + 1)
        }
    }
    
    fun refresh() {
        loadBalance()
        loadTransactions(1)
    }
    
    fun clearMessages() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }
}
