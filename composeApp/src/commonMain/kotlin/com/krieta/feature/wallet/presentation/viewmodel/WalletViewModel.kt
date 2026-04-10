package com.krieta.feature.wallet.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.wallet.domain.model.Transaction
import com.krieta.feature.wallet.domain.model.WalletBalance
import com.krieta.feature.wallet.domain.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class WalletState {
    data object Loading : WalletState()
    data class Success(val balance: WalletBalance, val recentTransactions: List<Transaction>) : WalletState()
    data class Error(val message: String) : WalletState()
}

class WalletViewModel(
    private val walletRepository: WalletRepository
) : ScreenModel {

    private val _state = MutableStateFlow<WalletState>(WalletState.Loading)
    val state: StateFlow<WalletState> = _state.asStateFlow()

    init {
        // Automatically sync balance and transactions on load
        fetchWalletData()
    }

    fun fetchWalletData() {
        screenModelScope.launch {
            _state.value = WalletState.Loading
            
            val balanceResult = walletRepository.getBalance()
            if (balanceResult is NetworkResult.Error) {
                _state.value = WalletState.Error(balanceResult.message)
                return@launch
            }
            
            val txResult = walletRepository.getTransactions(limit = 10, offset = 0)
            if (txResult is NetworkResult.Error) {
                _state.value = WalletState.Error(txResult.message)
                return@launch
            }

            val balance = (balanceResult as NetworkResult.Success).data
            val txList = (txResult as NetworkResult.Success).data
            
            _state.value = WalletState.Success(balance, txList)
        }
    }
}
