package com.krieta.feature.contentlock.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krieta.core.network.Result
import com.krieta.feature.contentlock.data.ContentLockRepository
import com.krieta.feature.contentlock.domain.ContentType
import com.krieta.feature.contentlock.domain.UnlockPrice
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
    
    private val _convertedKr = MutableStateFlow<Int?>(null)
    val convertedKr: StateFlow<Int?> = _convertedKr.asStateFlow()
    
    fun unlockContent(contentId: String, contentType: ContentType) {
        viewModelScope.launch {
            _uiState.value = ContentLockUiState.Loading
            when (val result = repository.unlockContent(contentId, contentType.toString())) {
                is Result.Success -> {
                    _uiState.value = ContentLockUiState.UnlockSuccess(
                        krPaid = result.data.unlockAmountKr,
                        creatorReceived = result.data.creatorReceivedKr
                    )
                }
                is Result.Error -> {
                    _uiState.value = ContentLockUiState.Error(result.message)
                }
            }
        }
    }
    
    fun getUnlockPrice(unlockAmountKr: Int, currency: String) {
        viewModelScope.launch {
            when (val result = repository.getUnlockPrice(unlockAmountKr, currency)) {
                is Result.Success -> {
                    _unlockPrice.value = UnlockPrice(
                        krAmount = result.data.krAmount,
                        fiatAmount = result.data.fiatAmount,
                        currency = result.data.currency,
                        displayText = result.data.displayText
                    )
                }
                is Result.Error -> {
                    _uiState.value = ContentLockUiState.Error(result.message)
                }
            }
        }
    }
    
    fun convertFiatToKr(fiatAmount: Double, currency: String) {
        viewModelScope.launch {
            when (val result = repository.convertFiatToKr(fiatAmount, currency)) {
                is Result.Success -> {
                    _convertedKr.value = result.data.krAmount
                }
                is Result.Error -> {
                    _uiState.value = ContentLockUiState.Error(result.message)
                }
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
