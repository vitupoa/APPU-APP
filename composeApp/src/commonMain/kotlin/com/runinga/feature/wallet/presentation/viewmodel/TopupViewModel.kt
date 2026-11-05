package com.runinga.feature.wallet.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.util.SafeConversion
import com.runinga.feature.wallet.domain.model.ExchangeRate
import com.runinga.feature.wallet.domain.repository.WalletRepository
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
    val success: Boolean = false,
    val paymentUrl: String? = null,
    val transactionId: String? = null,
    val reference: String? = null,
    val paymentInstructions: String? = null,
    val phoneNumber: String = "",
    val email: String = ""
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

    fun onPhoneNumberChanged(input: String) {
        _state.value = _state.value.copy(phoneNumber = input, error = null)
    }

    fun onEmailChanged(input: String) {
        _state.value = _state.value.copy(email = input, error = null)
    }

    private fun calculateKrPreview(input: String) {
        val fiatAmount = if (input.isEmpty()) {
            0.0
        } else {
            try {
                input.toDouble()
            } catch (e: Exception) {
                0.0
            }
        }
        
        val rate = _state.value.exchangeRate

        if (fiatAmount <= 0 || rate == null) {
            _state.value = _state.value.copy(krPreview = 0.0)
            return
        }

        // Apply 4.5% platform margin + KES 30 flat fee
        val fiatAfterFlatFee = kotlin.math.max(0.0, fiatAmount - 30.0)
        val platformMargin = 0.045
        val fiatAfterMargin = fiatAfterFlatFee * (1 - platformMargin)
        
        // User pays buyRate for top-up (they buy Rc)
        val krAmount = fiatAfterMargin / rate.buyRate
        _state.value = _state.value.copy(krPreview = krAmount)
    }

    private fun fetchExchangeRate() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingRate = true)
            println("🔍 TopupViewModel: Fetching exchange rate for currency: $userCurrency")
            
            when (val result = walletRepository.getExchangeRate(userCurrency)) {
                is NetworkResult.Success -> {
                    println("✅ TopupViewModel: Exchange rate loaded successfully: ${result.data}")
                    _state.value = _state.value.copy(
                        exchangeRate = result.data,
                        isLoadingRate = false
                    )
                    // Recalculate if user already typed something
                    calculateKrPreview(_state.value.fiatInput)
                }
                is NetworkResult.Error -> {
                    println("❌ TopupViewModel: Exchange rate error: ${result.message}")
                    _state.value = _state.value.copy(
                        error = "Exchange rate fetch failed: ${result.message}",
                        isLoadingRate = false
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun initiateTopup() {
        screenModelScope.launch {
            try {
                _state.value = _state.value.copy(isProcessing = true, error = null)
                
                val fiatAmount = if (_state.value.fiatInput.isEmpty()) {
                    0
                } else {
                    try {
                        _state.value.fiatInput.toInt()
                    } catch (e: Exception) {
                        0
                    }
                }
                
                if (fiatAmount <= 0) {
                    _state.value = _state.value.copy(
                        error = "Please enter a valid amount",
                        isProcessing = false
                    )
                    return@launch
                }

                val provider = _state.value.selectedProvider.name.lowercase()
                
                // Validate required fields based on provider
                val phoneNumber = if (provider == "mpesa") {
                    if (_state.value.phoneNumber.isBlank()) {
                        _state.value = _state.value.copy(
                            error = "Phone number required for M-Pesa",
                            isProcessing = false
                        )
                        return@launch
                    }
                    _state.value.phoneNumber
                } else null

                val email = if (provider == "paypal" || provider == "paystack") {
                    if (_state.value.email.isBlank()) {
                        _state.value = _state.value.copy(
                            error = "Email required for ${_state.value.selectedProvider.displayName}",
                            isProcessing = false
                        )
                        return@launch
                    }
                    _state.value.email
                } else null
                
                when (val result = walletRepository.initiateTopup(
                    fiatAmount = fiatAmount,
                    currency = userCurrency,
                    provider = provider,
                    phoneNumber = phoneNumber,
                    email = email
                )) {
                    is NetworkResult.Success -> {
                        val data = result.data
                        _state.value = _state.value.copy(
                            transactionId = data.transactionId,
                            reference = data.reference,
                            paymentUrl = data.paymentInstructions.paymentUrl,
                            paymentInstructions = data.paymentInstructions.instructions,
                            isProcessing = false
                        )
                        
                        // For PayPal/Paystack, user needs to complete payment via URL
                        // Payment confirmation will come via webhook callback
                        // For M-Pesa, STK push is sent, wait for user to enter PIN
                    }
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(
                            error = result.message ?: "Failed to initiate top-up",
                            isProcessing = false
                        )
                    }
                    is NetworkResult.Loading -> {}
                }
                
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "An error occurred",
                    isProcessing = false
                )
            }
        }
    }

    private suspend fun confirmTopup() {
        val transactionId = _state.value.transactionId ?: return
        
        when (val result = walletRepository.confirmTopup(
            transactionId = transactionId,
            reference = _state.value.reference
        )) {
            is NetworkResult.Success -> {
                _state.value = _state.value.copy(
                    success = true,
                    isProcessing = false,
                    error = null
                )
            }
            is NetworkResult.Error -> {
                _state.value = _state.value.copy(
                    error = result.message ?: "Failed to confirm top-up",
                    isProcessing = false
                )
            }
            is NetworkResult.Loading -> {}
        }
    }

    fun resetSuccess() {
        _state.value = _state.value.copy(success = false)
    }
}
