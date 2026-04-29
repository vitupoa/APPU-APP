package com.krieta.feature.wallet.presentation.withdraw
import com.krieta.com.core.util.SafeConversion
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.wallet.domain.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class WithdrawState(
    val provider: String = "mpesa", // mpesa, paypal, paystack
    val amount: String = "",
    val phoneNumber: String = "",
    val email: String = "",
    val accountNumber: String = "",
    val bankCode: String = "",
    val accountName: String = "",
    val country: String = "NG", // For Paystack: NG, GH, ZA, KE
    val verifiedAccountName: String? = null,
    val isVerifying: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val availableBalance: Double = 0.0,
    val banks: List<Bank> = emptyList(),
    val countries: List<Country> = emptyList()
)

data class Bank(
    val name: String,
    val code: String,
    val country: String,
    val currency: String
)

data class Country(
    val code: String,
    val name: String,
    val currency: String,
    val accountType: String
)

class WithdrawViewModel(
    private val repository: WalletRepository
) : ScreenModel {
    
    private val _state = MutableStateFlow(WithdrawState())
    val state: StateFlow<WithdrawState> = _state.asStateFlow()
    
    init {
        loadBalance()
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
    
    fun setProvider(provider: String) {
        _state.value = _state.value.copy(
            provider = provider,
            verifiedAccountName = null,
            error = null
        )
        
        if (provider == "paystack") {
            loadCountries()
        }
    }
    
    fun setAmount(amount: String) {
        _state.value = _state.value.copy(amount = amount)
    }
    
    fun setPhoneNumber(phoneNumber: String) {
        _state.value = _state.value.copy(phoneNumber = phoneNumber)
    }
    
    fun setEmail(email: String) {
        _state.value = _state.value.copy(email = email)
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
        _state.value = _state.value.copy(
            countries = listOf(
                Country("NG", "Nigeria", "NGN", "nuban"),
                Country("GH", "Ghana", "GHS", "mobile_money"),
                Country("ZA", "South Africa", "ZAR", "bank_account"),
                Country("KE", "Kenya", "KES", "mobile_money")
            )
        )
        loadBanks(_state.value.country)
    }
    
    private fun loadBanks(country: String = "NG") {
        _state.value = _state.value.copy(
            banks = listOf(
                Bank("Access Bank", "044", country, "NGN"),
                Bank("GTBank", "058", country, "NGN"),
                Bank("Zenith Bank", "057", country, "NGN")
            )
        )
    }
    
    fun verifyAccount() {
        _state.value = _state.value.copy(
            verifiedAccountName = "Account Holder Name",
            accountName = "Account Holder Name"
        )
    }
    
    fun withdraw() {
        screenModelScope.launch {
            val amount = if (_state.value.amount.isNotEmpty()) SafeConversion.toDoubleOrDefaultWithValidation(_state.value.amount, "withdrawAmount", 0.0, defaultValue = 0.0) else null
            if (amount == null || amount <= 0) {
                _state.value = _state.value.copy(error = "Invalid amount")
                return@launch
            }
            
            if (amount > _state.value.availableBalance) {
                _state.value = _state.value.copy(error = "Insufficient balance")
                return@launch
            }
            
            _state.value = _state.value.copy(isSubmitting = true, error = null)
            
            val request = mutableMapOf(
                "provider" to _state.value.provider,
                "krAmount" to amount,
                "currency" to when (_state.value.provider) {
                    "mpesa" -> "KES"
                    "paystack" -> _state.value.countries.find { it.code == _state.value.country }?.currency ?: "NGN"
                    else -> "USD"
                }
            )
            
            when (_state.value.provider) {
                "mpesa" -> request["phoneNumber"] = _state.value.phoneNumber
                "paypal" -> request["email"] = _state.value.email
                "paystack" -> {
                    request["accountNumber"] = _state.value.accountNumber
                    request["bankCode"] = _state.value.bankCode
                    request["accountName"] = _state.value.accountName
                    request["country"] = _state.value.country
                }
            }
            
            when (repository.withdraw(request)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        successMessage = "Withdrawal request submitted successfully",
                        amount = "",
                        phoneNumber = "",
                        email = "",
                        accountNumber = "",
                        bankCode = "",
                        accountName = "",
                        verifiedAccountName = null
                    )
                    loadBalance()
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isSubmitting = false,
                        error = "Withdrawal failed. Please try again."
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
