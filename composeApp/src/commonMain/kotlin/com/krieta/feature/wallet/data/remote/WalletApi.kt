package com.krieta.feature.wallet.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.wallet.data.remote.dto.ExchangeRateResponseDto
import com.krieta.feature.wallet.data.remote.dto.TipRequestDto
import com.krieta.feature.wallet.data.remote.dto.TipResponseDto
import com.krieta.feature.wallet.data.remote.dto.TransactionDto
import com.krieta.feature.wallet.data.remote.dto.WalletBalanceDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class WalletApi(
    private val httpClient: HttpClient
) {
    suspend fun getBalance(currency: String? = null): WalletBalanceDto {
        return httpClient.get(ApiConstants.WALLET_BALANCE) {
            if (currency != null) parameter("currency", currency)
        }.body()
    }

    suspend fun getExchangeRate(currency: String): ExchangeRateResponseDto {
        return httpClient.get(ApiConstants.WALLET_EXCHANGE_RATE) {
            parameter("currency", currency)
        }.body()
    }

    suspend fun sendTip(request: TipRequestDto): TipResponseDto {
        return httpClient.post(ApiConstants.WALLET_TIP) {
            setBody(request)
        }.body()
    }

    suspend fun getTransactions(limit: Int = 20, offset: Int = 0): List<TransactionDto> {
        return httpClient.get(ApiConstants.WALLET_TRANSACTIONS) {
            parameter("limit", limit)
            parameter("offset", offset)
        }.body()
    }
}
