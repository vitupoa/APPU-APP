package com.krieta.feature.wallet.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.util.SafeConversion
import com.krieta.feature.wallet.domain.model.ExchangeRate
import com.krieta.feature.wallet.domain.repository.WalletRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class WithdrawProvider(val displayName: String) {
    MPESA("M-Pesa"),
    PAYONEER("Payoneer")
}

data class WithdrawState(
    val selectedProvider: WithdrawProvider = WithdrawProvider.MPESA,
    val fiatInput: String = "",
    val krCost: Double = 0.0,
    val krBalance: Double = 0.0,
    val exchangeRate: ExchangeRate? = null,
    val destinationAccount: String = "",
    val isLoadingRate: Boolean = false,
    val isProcessing: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

class WithdrawViewModel(
    private val walletRepository: WalletRepository,
    private val userCurrency: String
) : ScreenModel {

    private val _state = MutableStateFlow(WithdrawState())
    val state: StateFlow<WithdrawState> = _state.asStateFlow()

    private var conversionJob: Job? = null

    init {
        fetchInitialData()
    }

    fun selectProvider(provider: WithdrawProvider) {
        _state.value = _state.value.copy(selectedProvider = provider)
    }

    fun onFiatAmountChanged(input: String) {
        _state.value = _state.value.copy(fiatInput = input, error = null)

        conversionJob?.cancel()
        conversionJob = screenModelScope.launch {
            delay(300)
            calculateKrCost(input)
        }
    }

    fun onDestinationChanged(input: String) {
        _state.value = _state.value.copy(destinationAccount = input, error = null)
    }

    private fun calculateKrCost(input: String) {
        val fiatAmount = SafeConversion.toDoubleOrDefaultWithValidation(
            value = input,
            fieldName = "withdrawAmount",
            min = 0.0,
            defaultValue = 0.0
        )
        val rate = _state.value.exchangeRate

        if (fiatAmount <= 0 || rate == null) {
            _state.value = _state.value.copy(krCost = 0.0)
            return
        }

        // Sell rate: how much Kr to get this fiat
        val krNeeded = fiatAmount / rate.sellRate
        _state.value = _state.value.copy(krCost = krNeeded)
    }

    private fun fetchInitialData() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingRate = true)

            // Fetch balance
            when (val balanceResult = walletRepository.getBalance()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(krBalance = balanceResult.data.krBalance)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = "Failed to load balance")
                }
                is NetworkResult.Loading -> {}
            }

            // Fetch rate
            when (val rateResult = walletRepository.getExchangeRate(userCurrency)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        exchangeRate = rateResult.data,
                        isLoadingRate = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        error = "Failed to load exchange rate",
                        isLoadingRate = false
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun hasSufficientBalance(): Boolean {
        return _state.value.krCost > 0 && _state.value.krCost <= _state.value.krBalance
    }
}
