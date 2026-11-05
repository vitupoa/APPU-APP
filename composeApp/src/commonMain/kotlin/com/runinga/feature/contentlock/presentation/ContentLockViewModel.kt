package com.runinga.feature.contentlock.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.contentlock.data.ContentLockRepository
import com.runinga.feature.contentlock.domain.ContentType
import com.runinga.feature.contentlock.domain.UnlockPrice
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ContentLockViewModel(
    private val repository: ContentLockRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<ContentLockUiState>(ContentLockUiState.Idle)
    val uiState: StateFlow<ContentLockUiState> = _uiState.asStateFlow()
    
    private val _unlockPrice = MutableStateFlow<UnlockPrice?>(null)
    val unlockPrice: StateFlow<UnlockPrice?> = _unlockPrice.asStateFlow()
    
    private val _convertedRc = MutableStateFlow<Int?>(null)
    val convertedKr: StateFlow<Int?> = _convertedKr.asStateFlow()
    
    fun unlockContent(contentId: String, contentType: ContentType) {
        viewModelScope.launch {
            _uiState.value = ContentLockUiState.Loading
            when (val result = repository.unlockContent(contentId, contentType.toString())) {
                is NetworkResult.Success -> {
                    _uiState.value = ContentLockUiState.UnlockSuccess(
                        krPaid = result.data.unlockAmountKr,
                        creatorReceived = result.data.creatorReceivedKr
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = ContentLockUiState.Error(result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun getUnlockPrice(unlockAmountKr: Int, currency: String) {
        viewModelScope.launch {
            when (val result = repository.getUnlockPrice(unlockAmountKr, currency)) {
                is NetworkResult.Success -> {
                    _unlockPrice.value = UnlockPrice(
                        krAmount = result.data.krAmount,
                        fiatAmount = result.data.fiatAmount,
                        currency = result.data.currency,
                        displayText = result.data.displayText
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = ContentLockUiState.Error(result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun convertFiatToKr(fiatAmount: Double, currency: String) {
        viewModelScope.launch {
            when (val result = repository.convertFiatToKr(fiatAmount, currency)) {
                is NetworkResult.Success -> {
                    _convertedKr.value = result.data.krAmount
                }
                is NetworkResult.Error -> {
                    _uiState.value = ContentLockUiState.Error(result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun resetState() {
        _uiState.value = ContentLockUiState.Idle
    }
}

sealed class ContentLockUiState {
    object Idle : ContentLockUiState()
    object Loading : ContentLockUiState()
    data class UnlockSuccess(val krPaid: Int, val creatorReceived: Int) : ContentLockUiState()
    data class Error(val message: String) : ContentLockUiState()
}
