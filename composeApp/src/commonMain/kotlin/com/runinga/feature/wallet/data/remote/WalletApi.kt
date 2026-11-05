package com.runinga.feature.wallet.data.remote

import com.runinga.com.core.network.ApiConstants
import com.runinga.feature.wallet.data.remote.dto.ExchangeRateResponseDto
import com.runinga.feature.wallet.data.remote.dto.TipRequestDto
import com.runinga.feature.wallet.data.remote.dto.TipResponseDto
import com.runinga.feature.wallet.data.remote.dto.TransactionDto
import com.runinga.feature.wallet.data.remote.dto.WalletBalanceDto
import com.runinga.feature.wallet.data.remote.dto.TopupInitiateRequestDto
import com.runinga.feature.wallet.data.remote.dto.TopupInitiateResponseDto
import com.runinga.feature.wallet.data.remote.dto.TopupConfirmRequestDto
import com.runinga.feature.wallet.data.remote.dto.TopupConfirmResponseDto
import com.runinga.feature.wallet.data.remote.dto.WithdrawRequestDto
import com.runinga.feature.wallet.data.remote.dto.WithdrawResponseDto
import com.runinga.feature.wallet.data.remote.dto.AccountVerificationDto
import com.runinga.feature.wallet.data.remote.dto.AccountVerificationResponseDto
import com.runinga.feature.wallet.data.remote.dto.BankDto
import com.runinga.feature.wallet.data.remote.dto.CountryDto
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
        println("🔍 Fetching wallet balance for currency: $currency")
        println("🔍 API Endpoint: ${ApiConstants.WALLET_BALANCE}")
        val response = httpClient.get(ApiConstants.WALLET_BALANCE) {
            if (currency != null) parameter("currency", currency)
        }
        println("✅ Wallet Balance Response Status: ${response.status}")
        return response.body()
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
        request: WithdrawRequestDto,
        signature: String,
        timestamp: Long,
        nonce: String
    ): WithdrawResponseDto {
        return httpClient.post("${ApiConstants.API_VERSION}/kyc/withdraw") {
            parameter("signature", signature)
            parameter("timestamp", timestamp)
            parameter("nonce", nonce)
            setBody(request)
        }.body()
    }

    suspend fun verifyAccount(request: AccountVerificationDto): AccountVerificationResponseDto {
        return httpClient.post("${ApiConstants.API_VERSION}/wallet/verify-account") {
            setBody(request)
        }.body()
    }

    suspend fun getBanks(country: String): List<BankDto> {
        return httpClient.get("${ApiConstants.API_VERSION}/wallet/banks") {
            parameter("country", country)
        }.body()
    }

    suspend fun getCountries(): List<CountryDto> {
        return httpClient.get("${ApiConstants.API_VERSION}/wallet/countries").body()
    }

    suspend fun initiateTopup(request: TopupInitiateRequestDto): TopupInitiateResponseDto {
        return httpClient.post(ApiConstants.WALLET_TOPUP_INITIATE) {
            setBody(request)
        }.body()
    }

    suspend fun confirmTopup(request: TopupConfirmRequestDto): TopupConfirmResponseDto {
        return httpClient.post("${ApiConstants.API_VERSION}/wallet/topup/confirm") {
            setBody(request)
        }.body()
    }
}
