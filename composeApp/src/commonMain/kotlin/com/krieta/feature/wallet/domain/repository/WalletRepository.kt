package com.krieta.feature.wallet.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.wallet.domain.model.ExchangeRate
import com.krieta.feature.wallet.domain.model.Transaction
import com.krieta.feature.wallet.domain.model.WalletBalance
import kotlinx.coroutines.flow.Flow

interface WalletRepository {
    val balance: Flow<WalletBalance?>
    
    suspend fun getBalance(): NetworkResult<WalletBalance>
    suspend fun sendTip(recipientId: String, fiatAmount: Double, currency: String): NetworkResult<Double>
    suspend fun getTransactions(limit: Int = 20, offset: Int = 0): NetworkResult<List<Transaction>>
    suspend fun getExchangeRate(currency: String): NetworkResult<ExchangeRate>
}
