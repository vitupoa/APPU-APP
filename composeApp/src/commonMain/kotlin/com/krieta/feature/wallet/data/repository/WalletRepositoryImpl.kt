package com.krieta.feature.wallet.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.com.core.security.TransactionSigner
import com.krieta.feature.wallet.data.remote.WalletApi
import com.krieta.feature.wallet.data.remote.dto.TipRequestDto
import com.krieta.feature.wallet.data.remote.dto.TopupInitiateRequestDto
import com.krieta.feature.wallet.data.remote.dto.TopupConfirmRequestDto
import com.krieta.feature.wallet.domain.model.ExchangeRate
import com.krieta.feature.wallet.domain.model.Transaction
import com.krieta.feature.wallet.domain.model.TransactionStatus
import com.krieta.feature.wallet.domain.model.TransactionType
import com.krieta.feature.wallet.domain.model.WalletBalance
import com.krieta.feature.wallet.domain.repository.WalletRepository
import com.krieta.feature.wallet.domain.repository.TopupInitiateResponse
import com.krieta.feature.wallet.domain.repository.TopupConfirmResponse
import com.krieta.feature.wallet.domain.repository.PaymentInstructions
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class WalletRepositoryImpl(
    private val api: WalletApi
) : WalletRepository {

    private val _balance = MutableStateFlow<WalletBalance?>(null)
    override val balance: Flow<WalletBalance?> = _balance.asStateFlow()

    override suspend fun getBalance(currency: String?): NetworkResult<WalletBalance> {
        return safeApiCall {
            val dto = api.getBalance(currency)
            val mapped = WalletBalance(
                krBalance = dto.krBalance,
                fiatEquivalent = dto.fiatEquivalent,
                currency = dto.currency,
                isWalletUnlocked = dto.isWalletUnlocked
            )
            _balance.value = mapped
            mapped
        }
    }

    override suspend fun getExchangeRate(currency: String): NetworkResult<ExchangeRate> {
        return safeApiCall {
            println("🔍 Fetching exchange rate for currency: $currency")
            val dto = api.getExchangeRate(currency)
            println("✅ Exchange rate DTO received: $dto")
            ExchangeRate(
                currency = dto.currency,
                baseRate = dto.baseRate,
                buyRate = dto.buyRate,
                sellRate = dto.sellRate,
                margin = dto.margin
            )
        }
    }

    override suspend fun sendTip(recipientId: String, fiatAmount: Double, currency: String): NetworkResult<Double> {
        return safeApiCall {
            val dto = api.sendTip(TipRequestDto(recipientId, fiatAmount, currency))
            if (!dto.success || dto.krTipped == null) {
                throw IllegalStateException(dto.error ?: "Tip failed")
            }
            
            // Refresh balance globally after successfully tipping
            getBalance()
            
            dto.krTipped
        }
    }

    override suspend fun getTransactions(limit: Int, offset: Int): NetworkResult<List<Transaction>> {
        return safeApiCall {
            val dtos = api.getTransactions(limit, offset)
            dtos.map { dto ->
                Transaction(
                    id = dto.id,
                    userId = dto.userId,
                    type = parseTransactionType(dto.type),
                    amountKr = dto.amountKr,
                    amountFiat = dto.amountFiat,
                    currency = dto.currency,
                    provider = dto.provider,
                    status = parseTransactionStatus(dto.status),
                    reference = dto.reference,
                    counterpartyId = dto.counterpartyId,
                    createdAt = dto.createdAt
                )
            }
        }
    }

    private fun parseTransactionType(type: String): TransactionType {
        return try {
            TransactionType.valueOf(type.uppercase())
        } catch (e: Exception) {
            TransactionType.UNKNOWN
        }
    }

    private fun parseTransactionStatus(status: String): TransactionStatus {
        return try {
            TransactionStatus.valueOf(status.uppercase())
        } catch (e: Exception) {
            TransactionStatus.UNKNOWN
        }
    }

    override suspend fun withdraw(request: Map<String, Any>): NetworkResult<Unit> {
        return safeApiCall {
            val krAmount = request["krAmount"] as? Double ?: throw IllegalArgumentException("krAmount required")
            val provider = request["provider"] as? String ?: throw IllegalArgumentException("provider required")
            val currency = request["currency"] as? String ?: throw IllegalArgumentException("currency required")
            
            val nonce = TransactionSigner.generateNonce()
            val timestamp = TransactionSigner.generateTimestamp()
            val signature = TransactionSigner.signWithdrawal(
                krAmount = krAmount,
                provider = provider,
                currency = currency,
                timestamp = timestamp,
                nonce = nonce
            )
            
            api.withdraw(request, signature, timestamp, nonce)
        }
    }

    override suspend fun initiateTopup(
        fiatAmount: Int,
        currency: String,
        provider: String,
        phoneNumber: String?,
        email: String?
    ): NetworkResult<TopupInitiateResponse> {
        return safeApiCall {
            val request = TopupInitiateRequestDto(
                fiatAmount = fiatAmount,
                currency = currency,
                provider = provider,
                phoneNumber = phoneNumber,
                email = email
            )
            val response = api.initiateTopup(request)
            
            TopupInitiateResponse(
                transactionId = response.transactionId,
                reference = response.reference,
                krAmount = response.krAmount,
                fiatAmount = response.fiatAmount,
                currency = response.currency,
                provider = response.provider,
                status = response.status,
                paymentInstructions = PaymentInstructions(
                    provider = response.paymentInstructions.provider,
                    amount = response.paymentInstructions.amount,
                    currency = response.paymentInstructions.currency,
                    instructions = response.paymentInstructions.instructions,
                    phoneNumber = response.paymentInstructions.phoneNumber,
                    paybill = response.paymentInstructions.paybill,
                    accountNumber = response.paymentInstructions.accountNumber,
                    paymentUrl = response.paymentInstructions.paymentUrl
                )
            )
        }
    }

    override suspend fun confirmTopup(
        transactionId: String,
        reference: String?
    ): NetworkResult<TopupConfirmResponse> {
        return safeApiCall {
            val request = TopupConfirmRequestDto(
                transactionId = transactionId,
                reference = reference
            )
            val response = api.confirmTopup(request)
            
            // Refresh balance after successful topup
            getBalance()
            
            TopupConfirmResponse(
                transactionId = response.transactionId,
                krAmount = response.krAmount,
                status = response.status
            )
        }
    }
}
