package com.krieta.feature.wallet.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.wallet.domain.model.ExchangeRate
import com.krieta.feature.wallet.domain.model.Transaction
import com.krieta.feature.wallet.domain.model.WalletBalance
import kotlinx.coroutines.flow.Flow

interface WalletRepository {
    val balance: Flow<WalletBalance?>
    
    suspend fun getBalance(currency: String? = null): NetworkResult<WalletBalance>
    suspend fun sendTip(recipientId: String, fiatAmount: Double, currency: String): NetworkResult<Double>
    suspend fun getTransactions(limit: Int = 20, offset: Int = 0): NetworkResult<List<Transaction>>
    suspend fun getExchangeRate(currency: String): NetworkResult<ExchangeRate>
    suspend fun withdraw(request: Map<String, Any>): NetworkResult<Unit>
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
    val amount: Int,
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
