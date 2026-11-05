package com.runinga.com.core.location

import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.wallet.domain.model.ExchangeRate
import com.runinga.feature.wallet.domain.repository.WalletRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Centralized currency provider that:
 * 1. Detects user's country via LocationProvider (SIM/carrier-based)
 * 2. Maps country to fiat currency via CurrencyMapper
 * 3. Fetches and caches exchange rate from the API
 * 4. Auto-refreshes every 5 minutes
 *
 * All screens (wallet, shop, tip, etc.) should use this single source of truth.
 */
class UserCurrencyProvider(
    private val locationProvider: LocationProvider,
    private val walletRepository: WalletRepository
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val countryCode: String by lazy { locationProvider.getCurrentCountry() }
    val currencyCode: String by lazy { locationProvider.getCurrentCurrency() }

    private val _exchangeRate = MutableStateFlow<ExchangeRate?>(null)
    val exchangeRate: StateFlow<ExchangeRate?> = _exchangeRate.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private var isStarted = false

    fun start() {
        if (!isStarted) {
            isStarted = true
            startAutoRefresh()
        }
    }

    fun fetchExchangeRate() {
        scope.launch {
            _isLoading.value = true
            when (val result = walletRepository.getExchangeRate(currencyCode)) {
                is NetworkResult.Success -> {
                    _exchangeRate.value = result.data
                }
                is NetworkResult.Error -> {
                    // Keep previous rate if available
                    println("Exchange rate fetch failed: ${result.message}")
                }
                is NetworkResult.Loading -> {}
            }
            _isLoading.value = false
        }
    }

    /**
     * Convert Rc amount to user's local fiat currency.
     * Returns 0.0 if exchange rate is not yet loaded.
     * 
     * New tokenomics: 1 Rc = 1 KES, 1 USD = 135 KES
     * Therefore: 1 Rc = 1/135 USD = 0.00740740741 USD
     * 
     * Formula: Fiat = (Rc / 135) × UsdToLocalRate
     * Example KES: (5 Rc / 135) × 135 = 5 KES ✓
     * Example TZS: (5 Rc / 135) × 2300 = 85.2 TZS ✓
     * Example UGX: (5 Rc / 135) × 3700 = 137 UGX ✓
     */
    fun krToFiat(krAmount: Double): Double {
        val rate = _exchangeRate.value ?: return 0.0
        // Convert Rc to USD, then to local fiat
        val usdAmount = krAmount / 135.0
        val fiatAmount = usdAmount * rate.baseRate
        return fiatAmount
    }

    /**
     * Convert local fiat currency to Rc amount.
     * Returns 0.0 if exchange rate is not yet loaded.
     * 
     * New tokenomics: 1 Rc = 1 KES, 1 USD = 135 KES
     * Therefore: 1 Rc = 1/135 USD = 0.00740740741 USD
     * 
     * Formula: Rc = (Fiat / UsdToLocalRate) × 135
     * This normalizes everything to KES equivalent
     * Example KES: (5 KES / 135) × 135 = 5 Rc ✓
     * Example TZS: (85 TZS / 2300) × 135 = 5 Rc ✓
     * Example UGX: (137 UGX / 3700) × 135 = 5 Rc ✓
     */
    fun convertLocalToKr(localAmount: Double): Double {
        val rate = _exchangeRate.value?.baseRate ?: return 0.0
        // Convert local amount to USD, then to Rc
        // Since 1 USD = 135 Rc and rate is USD to local fiat
        val usdAmount = localAmount / rate
        val krAmount = usdAmount * 135.0
        return krAmount
    }

    /**
     * Get the local currency symbol (e.g., "KES", "UGX")
     */
    val localCurrencySymbol: String
        get() = currencyCode

    /**
     * Format amount in local currency
     */
    fun formatLocalCurrency(amount: Double): String {
        return "$currencyCode ${String.format("%.2f", amount)}"
    }

    /**
     * Format Rc amount with Rc symbol: "Rc 500"
     */
    fun formatWithKr(krAmount: Double): String {
        return com.runinga.com.core.util.KrCurrencyFormatter.formatKr(krAmount)
    }

    /**
     * Format Rc with fiat equivalent: "Rc.500 (~KES 850)"
     */
    fun formatWithFiat(krAmount: Double): String {
        val fiat = krToFiat(krAmount)
        return com.runinga.com.core.util.KrCurrencyFormatter.formatKrWithFiat(
            krAmount, fiat, currencyCode
        )
    }

    private fun startAutoRefresh() {
        scope.launch {
            while (true) {
                fetchExchangeRate()
                delay(REFRESH_INTERVAL_MS)
            }
        }
    }

    companion object {
        private const val REFRESH_INTERVAL_MS = 5 * 60 * 1000L // 5 minutes
    }
}
