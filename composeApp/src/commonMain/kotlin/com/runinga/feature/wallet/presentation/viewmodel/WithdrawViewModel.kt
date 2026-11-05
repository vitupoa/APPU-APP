package com.runinga.feature.wallet.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.security.BiometricAuthenticator
import com.runinga.com.core.security.BiometricResult
import com.runinga.com.core.security.MultiSignatureManager
import com.runinga.com.core.security.SecureKeyStorage
import com.runinga.com.core.security.WithdrawalRateLimiter
import com.runinga.com.core.util.SafeConversion
import com.runinga.feature.wallet.domain.model.ExchangeRate
import com.runinga.feature.wallet.domain.repository.WalletRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.uuid.ExperimentalUuidApi
import com.runinga.com.core.util.currentTimeMillis
import kotlin.uuid.Uuid

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
    val success: Boolean = false,
    val requiresBiometric: Boolean = false,
    val requiresMultiSig: Boolean = false,
    val multiSigInfo: MultiSigInfo? = null,
    val rateLimitInfo: RateLimitInfo? = null,
    val hardwareSecurityAvailable: Boolean = false
)

data class MultiSigInfo(
    val transactionId: String,
    val requiredSignatures: Int,
    val currentSignatures: Int
)

data class RateLimitInfo(
    val withdrawalsToday: Int,
    val remainingWithdrawalsToday: Int,
    val amountTodayKr: Double,
    val remainingAmountTodayKr: Double
)

class WithdrawViewModel(
    private val walletRepository: WalletRepository,
    private val userCurrency: String,
    private val biometricAuthenticator: BiometricAuthenticator,
    private val secureKeyStorage: SecureKeyStorage,
    private val tokenManager: com.runinga.com.core.security.TokenManager
) : ScreenModel {

    private val _state = MutableStateFlow(WithdrawState())
    val state: StateFlow<WithdrawState> = _state.asStateFlow()

    private var conversionJob: Job? = null
    private val rateLimiter = WithdrawalRateLimiter()
    private val multiSigManager = MultiSignatureManager()
    
    private companion object {
        const val WITHDRAWAL_KEY_ALIAS = "runinga_withdrawal_key"
    }

    init {
        fetchInitialData()
        initializeSecurity()
    }
    
    private fun initializeSecurity() {
        screenModelScope.launch {
            // Check hardware security availability
            val hardwareAvailable = secureKeyStorage.isHardwareBackedSecurityAvailable()
            _state.value = _state.value.copy(hardwareSecurityAvailable = hardwareAvailable)
            
            // Generate secure key if not exists
            if (hardwareAvailable && !secureKeyStorage.keyExists(WITHDRAWAL_KEY_ALIAS)) {
                secureKeyStorage.generateKeyPair(WITHDRAWAL_KEY_ALIAS, requireBiometric = true)
            }
            
            // Load rate limit info
            updateRateLimitInfo()
        }
    }
    
    private suspend fun updateRateLimitInfo() {
        val stats = rateLimiter.getWithdrawalStats()
        _state.value = _state.value.copy(
            rateLimitInfo = RateLimitInfo(
                withdrawalsToday = stats.withdrawalsLastDay,
                remainingWithdrawalsToday = stats.remainingWithdrawalsToday,
                amountTodayRc = stats.amountLastDayKr,
                remainingAmountTodayRc = stats.remainingAmountTodayKr
            )
        )
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

        if ((fiatAmount ?: 0.0) <= 0 || rate == null) {
            _state.value = _state.value.copy(krCost = 0.0)
            return
        }

        // Sell rate: how much Rc to get this fiat
        val krNeeded = (fiatAmount ?: 0.0) / rate.sellRate
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
    
    @OptIn(ExperimentalUuidApi::class)
    fun withdraw() {
        screenModelScope.launch {
            try {
                _state.value = _state.value.copy(isProcessing = true, error = null)
                
                val krAmount = _state.value.krCost
                val provider = _state.value.selectedProvider.name.lowercase()
                val account = _state.value.destinationAccount
                
                // Get userId and deviceId
                val userId = tokenManager.getUserId() ?: ""
                val deviceId = com.runinga.com.core.util.DeviceFingerprint.getFingerprint()
                
                // Validation
                if (krAmount <= 0) {
                    _state.value = _state.value.copy(
                        error = "Invalid withdrawal amount",
                        isProcessing = false
                    )
                    return@launch
                }
                
                if (account.isBlank()) {
                    _state.value = _state.value.copy(
                        error = "Please enter destination account",
                        isProcessing = false
                    )
                    return@launch
                }
                
                if (!hasSufficientBalance()) {
                    _state.value = _state.value.copy(
                        error = "Insufficient balance",
                        isProcessing = false
                    )
                    return@launch
                }
                
                // Step 1: Check rate limits
                when (val rateLimitResult = rateLimiter.checkWithdrawal(krAmount)) {
                    is WithdrawalRateLimiter.RateLimitResult.Denied -> {
                        _state.value = _state.value.copy(
                            error = rateLimitResult.reason,
                            isProcessing = false
                        )
                        return@launch
                    }
                    is WithdrawalRateLimiter.RateLimitResult.Allowed -> {
                        // Continue
                    }
                }
                
                // Step 2: Check if multi-signature required
                val requiresMultiSig = multiSigManager.requiresMultiSignature(krAmount)
                if (requiresMultiSig) {
                    val transactionId = Uuid.random().toString()
                    val multiSigResult = multiSigManager.createPendingTransaction(
                        transactionId = transactionId,
                        userId = userId,
                        amountRc = krAmount,
                        provider = provider,
                        accountDetails = mapOf("account" to account)
                    )
                    
                    when (multiSigResult) {
                        is MultiSignatureManager.MultiSigResult.RequiresApproval -> {
                            _state.value = _state.value.copy(
                                requiresMultiSig = true,
                                multiSigInfo = MultiSigInfo(
                                    transactionId = multiSigResult.transactionId,
                                    requiredSignatures = multiSigResult.requiredSignatures,
                                    currentSignatures = multiSigResult.currentSignatures
                                ),
                                isProcessing = false
                            )
                            return@launch
                        }
                        else -> {}
                    }
                }
                
                // Step 3: Biometric authentication
                val biometricResult = biometricAuthenticator.authenticateForTransaction(
                    title = "Confirm Withdrawal",
                    subtitle = "Withdraw ${krAmount.toInt()} Rc",
                    description = "Authenticate to complete withdrawal to $account"
                )
                
                when (biometricResult) {
                    is BiometricResult.Success -> {
                        // Continue
                    }
                    is BiometricResult.Cancelled -> {
                        _state.value = _state.value.copy(
                            error = "Authentication cancelled",
                            isProcessing = false
                        )
                        return@launch
                    }
                    is BiometricResult.Error -> {
                        _state.value = _state.value.copy(
                            error = "Authentication failed: ${biometricResult.message}",
                            isProcessing = false
                        )
                        return@launch
                    }
                    is BiometricResult.NotAvailable -> {
                        _state.value = _state.value.copy(
                            error = "Biometric authentication not available",
                            isProcessing = false
                        )
                        return@launch
                    }
                }
                
                // Step 4: Hardware-backed signing (if available)
                val signature = if (_state.value.hardwareSecurityAvailable) {
                    val dataToSign = "$userId|$krAmount|$provider|$account".encodeToByteArray()
                    secureKeyStorage.signData(WITHDRAWAL_KEY_ALIAS, dataToSign)
                } else {
                    null
                }
                
                // Step 5: Submit withdrawal request
                val timestamp = currentTimeMillis()
                val nonce = com.runinga.com.core.security.WithdrawalSecurity.generateNonce()
                val amountHash = com.runinga.com.core.security.WithdrawalSecurity.generateAmountHash(
                    userId = userId,
                    amount = krAmount,
                    timestamp = timestamp,
                    nonce = nonce
                )
                val balanceHash = com.runinga.com.core.security.WithdrawalSecurity.generateBalanceHash(
                    userId = userId,
                    balance = _state.value.krBalance,
                    timestamp = timestamp,
                    nonce = nonce
                )
                
                val request = com.runinga.feature.wallet.domain.repository.WithdrawRequest(
                    provider = provider,
                    krAmount = krAmount,
                    currency = userCurrency,
                    phoneNumber = if (provider == "mpesa") account else null,
                    accountNumber = if (provider != "mpesa") account else null,
                    amountHash = amountHash,
                    requestTimestamp = timestamp,
                    balanceHash = balanceHash
                )
                
                when (val result = walletRepository.withdraw(request)) {
                    is NetworkResult.Success -> {
                        // Record successful withdrawal for rate limiting
                        rateLimiter.recordWithdrawal(krAmount)
                        updateRateLimitInfo()
                        
                        _state.value = _state.value.copy(
                            success = true,
                            isProcessing = false,
                            error = null
                        )
                    }
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(
                            error = result.message ?: "Withdrawal failed",
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
    
    fun resetSuccess() {
        _state.value = _state.value.copy(success = false)
    }
}

