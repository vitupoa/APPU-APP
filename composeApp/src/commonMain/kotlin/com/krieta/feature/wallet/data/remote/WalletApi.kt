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
        return try {
            println("🔍 Fetching wallet balance for currency: $currency")
            val response = httpClient.get(ApiConstants.WALLET_BALANCE) {
                if (currency != null) parameter("currency", currency)
            }
            
            println("🔍 Wallet Balance Response Status: ${response.status}")
            
            // Try to get raw response
            val rawBody = try {
                response.body<String>()
            } catch (e: Exception) {
                "Unable to read body"
            }
            println("🔍 Wallet Balance Raw Response: $rawBody")
            
            val result: WalletBalanceDto = response.body()
            println("✅ Wallet Balance Parsed: $result")
            result
        } catch (e: Exception) {
            println("❌ Wallet Balance Error: ${e.message}")
            throw e
        }
    }

    suspend fun getExchangeRate(currency: String): ExchangeRateResponseDto {
        return try {
            val response = httpClient.get(ApiConstants.WALLET_EXCHANGE_RATE) {
                parameter("currency", currency)
            }
            
            println("🔍 Exchange Rate API Response Status: ${response.status}")
            
            // Try to get the raw response body first
            val rawBody = try {
                response.body<String>()
            } catch (e: Exception) {
                "Unable to read body as string"
            }
            println("🔍 Exchange Rate API Raw Response: $rawBody")
            
            // Now try to parse as DTO
            val result: ExchangeRateResponseDto = response.body()
            println("✅ Exchange Rate Parsed Successfully: $result")
            result
        } catch (e: Exception) {
            println("❌ Exchange Rate API Error: ${e.message}")
            println("❌ Error Type: ${e::class.simpleName}")
            throw e
        }
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

    suspend fun withdraw(
        request: Map<String, Any>,
        signature: String,
        timestamp: Long,
        nonce: String
    ) {
        httpClient.post("${ApiConstants.API_VERSION}/kyc/withdraw") {
            parameter("signature", signature)
            parameter("timestamp", timestamp)
            parameter("nonce", nonce)
            setBody(request)
        }
    }
}
