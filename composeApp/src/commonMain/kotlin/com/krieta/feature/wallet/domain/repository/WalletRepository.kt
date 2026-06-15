package com.krieta.feature.wallet.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.wallet.domain.model.ExchangeRate
import com.krieta.feature.wallet.domain.model.Transaction
import com.krieta.feature.wallet.domain.model.WalletBalance
import kotlinx.coroutines.flow.Flow

interface WalletRepository {
    val balance: Flow<WalletBalance?>
    
    suspend fun getBalance(currency: String? = null): NetworkResult<WalletBalance>
    suspend fun sendTip(recipientId: String, krAmount: Double, currency: String): NetworkResult<Double>
    suspend fun getTransactions(limit: Int = 20, offset: Int = 0): NetworkResult<List<Transaction>>
    suspend fun getExchangeRate(currency: String): NetworkResult<ExchangeRate>
    suspend fun withdraw(request: WithdrawRequest): NetworkResult<WithdrawResponse>
    suspend fun verifyAccount(accountNumber: String, bankCode: String, country: String): NetworkResult<AccountVerification>
    suspend fun getBanks(country: String): NetworkResult<List<Bank>>
    suspend fun getCountries(): NetworkResult<List<Country>>
    suspend fun initiateTopup(fiatAmount: Int, currency: String, provider: String, phoneNumber: String?, email: String? = null): NetworkResult<TopupInitiateResponse>
    suspend fun confirmTopup(transactionId: String, reference: String?): NetworkResult<TopupConfirmResponse>
}

data class TopupInitiateResponse(
    val transactionId: String,
    val reference: String,
    val krAmount: Int,
    val fiatAmount: Int,
    val currency: String,
    val provider: String,
    val status: String,
    val paymentInstructions: PaymentInstructions
)

data class PaymentInstructions(
    val provider: String,
    val amount: String,
    val currency: String,
    val instructions: String,
    val phoneNumber: String? = null,
    val paybill: String? = null,
    val accountNumber: String? = null,
    val paymentUrl: String? = null
)

data class TopupConfirmResponse(
    val transactionId: String,
    val krAmount: Int,
    val status: String
)

data class WithdrawRequest(
    val provider: String, // mpesa, paystack, bank
    val krAmount: Double,
    val currency: String,
    val phoneNumber: String? = null, // For M-Pesa
    val accountNumber: String? = null, // For Bank/Paystack
    val bankCode: String? = null, // For Bank/Paystack
    val accountName: String? = null, // For Bank/Paystack - must match user's name
    val country: String? = null, // For Paystack
    val deviceSecurityScore: Int? = null,
    val isRooted: Boolean? = null,
    val isEmulator: Boolean? = null,
    // Security: Amount validation hash to prevent tampering
    val amountHash: String,
    // Security: Timestamp to prevent replay attacks
    val requestTimestamp: Long,
    // Security: Client-side balance check hash
    val balanceHash: String
)

data class WithdrawResponse(
    val success: Boolean,
    val transactionId: String? = null,
    val message: String? = null,
    val error: String? = null,
    val processingTime: String? = null
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

data class AccountVerification(
    val success: Boolean,
    val accountName: String? = null,
    val error: String? = null
)
