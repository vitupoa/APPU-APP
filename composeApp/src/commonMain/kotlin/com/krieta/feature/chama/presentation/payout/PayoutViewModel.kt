package com.krieta.feature.chama.presentation.payout

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.domain.repository.ChamaRepository
import com.krieta.feature.chama.data.remote.dto.RequestPayoutRequest
import com.krieta.feature.chama.data.remote.dto.ApprovePayoutRequest
import com.krieta.feature.chama.data.remote.dto.ChamaPayoutDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PayoutState(
    val pendingPayouts: List<ChamaPayoutDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val isSubmitting: Boolean = false
)

class PayoutViewModel(
    private val repository: ChamaRepository,
    private val chamaId: String
) : ScreenModel {
    
    private val _state = MutableStateFlow(PayoutState())
    val state: StateFlow<PayoutState> = _state.asStateFlow()
    
    init {
        loadPendingPayouts()
    }
    
    private fun loadPendingPayouts() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            // Note: You'll need to add getPendingPayouts to repository
            // For now, this is a placeholder
            _state.value = _state.value.copy(
                pendingPayouts = emptyList(),
                isLoading = false
            )
        }
    }
    
    fun requestPayout(recipientUserId: String, amountKr: Double) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isSubmitting = true, error = null)
            
            val request = RequestPayoutRequest(
                recipientUserId = recipientUserId,
                amountKr = amountKr
            )
            
            when (repository.requestPayout(chamaId, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        successMessage = "Payout request submitted successfully"
                    )
                    loadPendingPayouts()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        error = "Failed to submit payout request"
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun approvePayout(payoutId: String, decision: String, reason: String? = null) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isSubmitting = true, error = null)
            
            val request = ApprovePayoutRequest(
                decision = decision,
                reason = reason
            )
            
            when (repository.approvePayout(chamaId, payoutId, request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        successMessage = "Payout ${decision.lowercase()} successfully"
                    )
                    loadPendingPayouts()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        error = "Failed to process payout"
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
