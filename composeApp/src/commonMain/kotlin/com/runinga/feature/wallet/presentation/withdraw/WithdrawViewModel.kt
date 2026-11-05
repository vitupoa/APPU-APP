package com.runinga.feature.wallet.presentation.withdraw
import com.runinga.com.core.util.SafeConversion
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.wallet.domain.repository.WalletRepository
import com.runinga.feature.wallet.domain.repository.Bank
import com.runinga.feature.wallet.domain.repository.Country
import com.runinga.com.security.DeviceSecurityChecker
import com.runinga.com.core.security.WithdrawalSecurity
import com.runinga.com.core.security.ValidationResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.runinga.com.core.util.currentTimeMillis

data class WithdrawState(
    val provider: String = "mpesa", // mpesa, paystack, bank
    val amount: String = "",
    val phoneNumber: String = "",
    val accountNumber: String = "",
    val bankCode: String = "",
    val accountName: String = "",
    val country: String = "KE", // Default to Kenya for M-Pesa
    val verifiedAccountName: String? = null,
    val isVerifying: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val availableBalance: Double = 0.0,
    val banks: List<Bank> = emptyList(),
    val countries: List<Country> = emptyList(),
    val userFullName: String = "", // User's full name from profile
    val userId: String = "", // User ID for security validation
    // Security: Track the last validated amount to prevent tampering
    val lastValidatedAmount: Double = 0.0,
    val lastValidationTimestamp: Long = 0L
)

class WithdrawViewModel(
    private val repository: WalletRepository,
    private val deviceSecurityChecker: DeviceSecurityChecker
) : ScreenModel {
    
    private val _state = MutableStateFlow(WithdrawState())
    val state: StateFlow<WithdrawState> = _state.asStateFlow()
    
    init {
        loadBalance()
        loadUserProfile()
    }
    
    private fun loadBalance() {
        screenModelScope.launch {
            when (val result = repository.getBalance()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        availableBalance = result.data.krBalance
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    private fun loadUserProfile() {
        // TODO: Load user profile to get full name
        // For now, we'll use a placeholder
        _state.value = _state.value.copy(userFullName = "John Doe")
    }
    
    fun setProvider(provider: String) {
        _state.value = _state.value.copy(
            provider = provider,
            verifiedAccountName = null,
            error = null
        )
        
        when (provider) {
            "paystack" -> {
                loadCountries()
            }
            "bank" -> {
                loadCountries()
            }
        }
    }
    
    fun setAmount(amount: String) {
        // Security: Validate amount input to prevent injection
        val sanitizedAmount = sanitizeAmountInput(amount)
        
        // Validate the amount using security checks
        val currentState = _state.value
        val numericAmount = sanitizedAmount.toDoubleOrNull()
        
        if (numericAmount != null) {
            val validation = WithdrawalSecurity.validateWithdrawalAmount(
                requestedAmount = numericAmount,
                availableBalance = currentState.availableBalance
            )
            
            if (!validation.isValid) {
                _state.value = currentState.copy(
                    amount = sanitizedAmount,
                    error = validation.message
                )
                return
            }
            
            // Clear any previous errors if validation passes
            _state.value = currentState.copy(
                amount = sanitizedAmount,
                error = null,
                lastValidatedAmount = numericAmount,
                lastValidationTimestamp = currentTimeMillis()
            )
        } else {
            _state.value = currentState.copy(
                amount = sanitizedAmount,
                error = if (sanitizedAmount.isNotEmpty()) "Invalid amount format" else null
            )
        }
    }
    
    /**
     * Sanitize amount input to prevent injection attacks
     */
    private fun sanitizeAmountInput(input: String): String {
        // Remove any non-numeric characters except decimal point
        val sanitized = input.filter { it.isDigit() || it == '.' }
        
        // Ensure only one decimal point
        val parts = sanitized.split('.')
        return if (parts.size > 2) {
            parts[0] + "." + parts.drop(1).joinToString("")
        } else {
            sanitized
        }
    }
    
    fun setPhoneNumber(phoneNumber: String) {
        _state.value = _state.value.copy(phoneNumber = phoneNumber)
    }
    
    fun setAccountNumber(accountNumber: String) {
        _state.value = _state.value.copy(accountNumber = accountNumber)
    }
    
    fun setBankCode(bankCode: String) {
        _state.value = _state.value.copy(bankCode = bankCode)
    }
    
    fun setAccountName(accountName: String) {
        _state.value = _state.value.copy(accountName = accountName)
    }
    
    fun setCountry(country: String) {
        _state.value = _state.value.copy(
            country = country,
            bankCode = "",
            accountNumber = "",
            verifiedAccountName = null
        )
        loadBanks(country)
    }
    
    private fun loadCountries() {
        screenModelScope.launch {
            when (val result = repository.getCountries()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(countries = result.data)
                    loadBanks(_state.value.country)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    private fun loadBanks(country: String) {
        screenModelScope.launch {
            when (val result = repository.getBanks(country)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(banks = result.data)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun verifyAccount() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isVerifying = true, error = null)
            
            when (val result = repository.verifyAccount(
                accountNumber = _state.value.accountNumber,
                bankCode = _state.value.bankCode,
                country = _state.value.country
            )) {
                is NetworkResult.Success -> {
                    val verification = result.data
                    if (verification.success && verification.accountName != null) {
                        // Check if account name matches user's name
                        val userFullName = _state.value.userFullName.lowercase().trim()
                        val accountName = verification.accountName.lowercase().trim()
                        
                        val nameMatches = userFullName == accountName || 
                                        accountName.contains(userFullName) ||
                                        userFullName.contains(accountName)
                        
                        if (nameMatches) {
                            _state.value = _state.value.copy(
                                isVerifying = false,
                                verifiedAccountName = verification.accountName,
                                accountName = verification.accountName
                            )
                        } else {
                            _state.value = _state.value.copy(
                                isVerifying = false,
                                error = "Account name '${verification.accountName}' does not match your profile name '${_state.value.userFullName}'. Please use an account registered in your name."
                            )
                        }
                    } else {
                        _state.value = _state.value.copy(
                            isVerifying = false,
                            error = verification.error ?: "Account verification failed"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isVerifying = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun withdraw() {
        screenModelScope.launch {
            val currentState = _state.value
            
            // Step 1: Comprehensive amount validation
            val amount = validateWithdrawalAmount(currentState)
            if (amount == null) return@launch
            
            // Step 2: Security validation - ensure amount hasn't been tampered with
            if (!validateAmountIntegrity(amount, currentState)) {
                _state.value = currentState.copy(
                    error = "Security Error: Amount validation failed. Please re-enter the amount."
                )
                return@launch
            }
            
            // Step 3: Re-validate balance to prevent race conditions
            if (!validateSufficientBalance(amount, currentState)) {
                return@launch
            }
            
            // Step 4: Check device security
            val securityStatus = deviceSecurityChecker.checkDeviceSecurity()
            
            if (securityStatus.isRooted) {
                _state.value = currentState.copy(
                    error = "Security Error: Withdrawals are not allowed from rooted or jailbroken devices for your protection."
                )
                return@launch
            }
            
            if (securityStatus.securityScore < 50) {
                _state.value = currentState.copy(
                    error = "Security Error: Device security score too low. Please secure your device and try again."
                )
                return@launch
            }
            
            // Step 5: Validate provider-specific requirements
            if (!validateProviderRequirements(currentState)) {
                return@launch
            }
            
            _state.value = currentState.copy(isSubmitting = true, error = null)
            
            // Step 6: Generate security hashes
            val timestamp = currentTimeMillis()
            val nonce = WithdrawalSecurity.generateNonce()
            val amountHash = WithdrawalSecurity.generateAmountHash(
                amount = amount,
                nonce = nonce,
                userId = currentState.userId,
                timestamp = timestamp
            )
            val balanceHash = WithdrawalSecurity.generateBalanceHash(
                balance = currentState.availableBalance,
                nonce = nonce,
                userId = currentState.userId,
                timestamp = timestamp
            )
            
            val request = com.runinga.feature.wallet.domain.repository.WithdrawRequest(
                provider = currentState.provider,
                krAmount = amount,
                currency = when (currentState.provider) {
                    "mpesa" -> "KES"
                    "paystack", "bank" -> currentState.countries.find { it.code == currentState.country }?.currency ?: "KES"
                    else -> "USD"
                },
                phoneNumber = if (currentState.provider == "mpesa") currentState.phoneNumber else null,
                accountNumber = if (currentState.provider in listOf("paystack", "bank")) currentState.accountNumber else null,
                bankCode = if (currentState.provider in listOf("paystack", "bank")) currentState.bankCode else null,
                accountName = if (currentState.provider in listOf("paystack", "bank")) currentState.accountName else null,
                country = if (currentState.provider in listOf("paystack", "bank")) currentState.country else null,
                deviceSecurityScore = securityStatus.securityScore,
                isRooted = securityStatus.isRooted,
                isEmulator = securityStatus.isEmulator,
                amountHash = amountHash,
                requestTimestamp = timestamp,
                balanceHash = balanceHash
            )
            
            when (val result = repository.withdraw(request)) {
                is NetworkResult.Success -> {
                    val response = result.data
                    if (response.success) {
                        _state.value = currentState.copy(
                            isSubmitting = false,
                            successMessage = response.message ?: "Withdrawal request submitted successfully",
                            amount = "",
                            phoneNumber = "",
                            accountNumber = "",
                            bankCode = "",
                            accountName = "",
                            verifiedAccountName = null,
                            lastValidatedAmount = 0.0,
                            lastValidationTimestamp = 0L
                        )
                        loadBalance()
                    } else {
                        _state.value = currentState.copy(
                            isSubmitting = false,
                            error = response.error ?: "Withdrawal failed"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.value = currentState.copy(
                        isSubmitting = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    /**
     * Validate withdrawal amount with comprehensive checks
     */
    private fun validateWithdrawalAmount(state: WithdrawState): Double? {
        val amount = state.amount.toDoubleOrNull()
        
        if (amount == null) {
            _state.value = state.copy(error = "Please enter a valid amount")
            return null
        }
        
        val validation = WithdrawalSecurity.validateWithdrawalAmount(
            requestedAmount = amount,
            availableBalance = state.availableBalance
        )
        
        if (!validation.isValid) {
            _state.value = state.copy(error = validation.message)
            return null
        }
        
        return amount
    }
    
    /**
     * Validate amount integrity to prevent tampering
     */
    private fun validateAmountIntegrity(amount: Double, state: WithdrawState): Boolean {
        // Check if the amount matches the last validated amount
        if (state.lastValidatedAmount != amount) {
            return false
        }
        
        // Check if the validation timestamp is recent (within 5 minutes)
        val currentTime = currentTimeMillis()
        val maxAge = 5 * 60 * 1000L // 5 minutes
        
        return (currentTime - state.lastValidationTimestamp) <= maxAge
    }
    
    /**
     * Validate sufficient balance with fresh data
     */
    private suspend fun validateSufficientBalance(amount: Double, state: WithdrawState): Boolean {
        // Refresh balance to get the latest data
        when (val result = repository.getBalance()) {
            is NetworkResult.Success -> {
                val currentBalance = result.data.krBalance
                
                if (amount > currentBalance) {
                    _state.value = state.copy(
                        error = "Insufficient balance. Available: $currentBalance Rc, Requested: $amount Rc",
                        availableBalance = currentBalance
                    )
                    return false
                }
                
                // Update state with fresh balance
                _state.value = state.copy(availableBalance = currentBalance)
                return true
            }
            is NetworkResult.Error -> {
                _state.value = state.copy(error = "Failed to verify balance: ${result.message}")
                return false
            }
            is NetworkResult.Loading -> {
                return false
            }
        }
    }
    
    /**
     * Validate provider-specific requirements
     */
    private fun validateProviderRequirements(state: WithdrawState): Boolean {
        when (state.provider) {
            "mpesa" -> {
                if (state.phoneNumber.isEmpty()) {
                    _state.value = state.copy(error = "Phone number is required for M-Pesa withdrawals")
                    return false
                }
                
                // Validate phone number format
                if (!state.phoneNumber.matches(Regex("^\\d{10,15}$"))) {
                    _state.value = state.copy(error = "Invalid phone number format. Use digits only (10-15 digits)")
                    return false
                }
            }
            
            "paystack", "bank" -> {
                if (state.accountNumber.isEmpty()) {
                    _state.value = state.copy(error = "Account number is required for bank withdrawals")
                    return false
                }
                
                if (state.bankCode.isEmpty()) {
                    _state.value = state.copy(error = "Bank code is required for bank withdrawals")
                    return false
                }
                
                // For countries other than Kenya, account verification is required
                if (state.country != "KE" && state.verifiedAccountName == null) {
                    _state.value = state.copy(error = "Please verify your account details first")
                    return false
                }
            }
        }
        
        return true
    }
    
    fun clearMessages() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }
}
