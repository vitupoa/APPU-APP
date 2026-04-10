package com.krieta.feature.wallet.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.wallet.domain.model.ExchangeRate
import com.krieta.feature.wallet.domain.repository.WalletRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class PaymentProvider(val displayName: String) {
    MPESA("M-Pesa"),
    PAYPAL("PayPal"),
    PAYSTACK("Paystack")
}

data class TopupState(
    val selectedProvider: PaymentProvider = PaymentProvider.MPESA,
    val fiatInput: String = "",
    val krPreview: Double = 0.0,
    val exchangeRate: ExchangeRate? = null,
    val isLoadingRate: Boolean = false,
    val isProcessing: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

class TopupViewModel(
    private val walletRepository: WalletRepository,
    private val userCurrency: String // Injected from user session
) : ScreenModel {

    private val _state = MutableStateFlow(TopupState())
    val state: StateFlow<TopupState> = _state.asStateFlow()

    private var conversionJob: Job? = null

    init {
        fetchExchangeRate()
    }

    fun selectProvider(provider: PaymentProvider) {
        _state.value = _state.value.copy(selectedProvider = provider)
    }

    fun onFiatAmountChanged(input: String) {
        _state.value = _state.value.copy(fiatInput = input, error = null)

        // Debounce the conversion preview
        conversionJob?.cancel()
        conversionJob = screenModelScope.launch {
            delay(300)
            calculateKrPreview(input)
        }
    }

    private fun calculateKrPreview(input: String) {
        val fiatAmount = input.toDoubleOrNull()
        val rate = _state.value.exchangeRate

        if (fiatAmount == null || fiatAmount <= 0 || rate == null) {
            _state.value = _state.value.copy(krPreview = 0.0)
            return
        }

        // User pays buyRate for top-up (they buy Kr)
        val krAmount = fiatAmount / rate.buyRate
        _state.value = _state.value.copy(krPreview = krAmount)
    }

    private fun fetchExchangeRate() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingRate = true)
            when (val result = walletRepository.getExchangeRate(userCurrency)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        exchangeRate = result.data,
                        isLoadingRate = false
                    )
                    // Recalculate if user already typed something
                    calculateKrPreview(_state.value.fiatInput)
                }
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
}
