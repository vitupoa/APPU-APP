package com.krieta.feature.wallet.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
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
import com.krieta.feature.wallet.domain.repository.WithdrawRequest
import com.krieta.feature.wallet.domain.repository.WithdrawResponse
import com.krieta.feature.wallet.domain.repository.Bank
import com.krieta.feature.wallet.domain.repository.Country
import com.krieta.feature.wallet.domain.repository.AccountVerification
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class WalletRepositoryImpl(
    private val api: WalletApi,
    private val financialSecurity: com.krieta.com.core.security.FinancialTransactionSecurity,
    private val offlineModeGuard: com.krieta.com.core.offline.OfflineModeGuard,
    private val tokenManager: com.krieta.com.core.security.TokenManager
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

    override suspend fun sendTip(recipientId: String, krAmount: Int, currency: String): NetworkResult<Double> {
        return safeApiCall {
            // CRITICAL: Block if offline
            offlineModeGuard.requireOnlineForFinancialTransaction()
            
            // Validate amount
            val validation = financialSecurity.validateAmount(
                amount = krAmount.toDouble(),
                minAmount = 1.0,
                maxAmount = 10000.0
            )
            if (!validation.isValid) {
                throw IllegalArgumentException(validation.message)
            }
            
            // Get current user ID
            val userSession = tokenManager.getUserSession()
                ?: throw IllegalStateException("User session not found")
            
            // Generate nonce and timestamp
            val nonce = com.krieta.com.core.security.WithdrawalSecurity.generateNonce()
            val timestamp = com.krieta.com.core.util.currentTimeMillis()
            val signature = financialSecurity.signTip(
                senderId = userSession.userId,
                recipientId = recipientId,
                krAmount = krAmount,
                nonce = nonce,
                timestamp = timestamp
            ) ?: throw IllegalStateException("Session expired. Please login again.")

            val dto = api.sendTip(TipRequestDto(
                recipientId = recipientId,
                krAmount = krAmount,
                currency = currency,
                signature = signature,
                timestamp = timestamp,
                nonce = nonce
            ))
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

    override suspend fun withdraw(request: WithdrawRequest): NetworkResult<WithdrawResponse> {
        return safeApiCall {
            // CRITICAL: Block if offline
            offlineModeGuard.requireOnlineForFinancialTransaction()
            
            // Validate amount
            val validation = financialSecurity.validateAmount(
                amount = request.krAmount,
                minAmount = 10.0,
                maxAmount = 100000.0
            )
            if (!validation.isValid) {
                throw IllegalArgumentException(validation.message)
            }
            
            // Get current user ID
            val userSession = tokenManager.getUserSession()
                ?: throw IllegalStateException("User session not found")
            
            // Generate nonce and timestamp
            val nonce = com.krieta.com.core.security.WithdrawalSecurity.generateNonce()
            val timestamp = com.krieta.com.core.util.currentTimeMillis()
            val signature = financialSecurity.signWithdrawal(
                userId = userSession.userId,
                krAmount = request.krAmount,
                provider = request.provider,
                currency = request.currency,
                nonce = nonce,
                timestamp = timestamp
            ) ?: throw IllegalStateException("Session expired. Please login again.")
            
            val dto = api.withdraw(
                request = com.krieta.feature.wallet.data.remote.dto.WithdrawRequestDto(
                    provider = request.provider,
                    krAmount = request.krAmount,
                    currency = request.currency,
                    phoneNumber = request.phoneNumber,
                    accountNumber = request.accountNumber,
                    bankCode = request.bankCode,
                    accountName = request.accountName,
                    country = request.country,
                    deviceSecurityScore = request.deviceSecurityScore,
                    isRooted = request.isRooted,
                    isEmulator = request.isEmulator,
                    amountHash = request.amountHash,
                    requestTimestamp = request.requestTimestamp,
                    balanceHash = request.balanceHash
                ),
                signature = signature,
                timestamp = timestamp,
                nonce = nonce
            )
            
            WithdrawResponse(
                success = dto.success,
                transactionId = dto.transactionId,
                message = dto.message,
                error = dto.error,
                processingTime = dto.processingTime
            )
        }
    }

    override suspend fun verifyAccount(accountNumber: String, bankCode: String, country: String): NetworkResult<AccountVerification> {
        return safeApiCall {
            val dto = api.verifyAccount(
                com.krieta.feature.wallet.data.remote.dto.AccountVerificationDto(
                    accountNumber = accountNumber,
                    bankCode = bankCode,
                    country = country
                )
            )
            
            AccountVerification(
                success = dto.success,
                accountName = dto.accountName,
                error = dto.error
            )
        }
    }

    override suspend fun getBanks(country: String): NetworkResult<List<Bank>> {
        return safeApiCall {
            val dtos = api.getBanks(country)
            dtos.map { dto ->
                Bank(
                    name = dto.name,
                    code = dto.code,
                    country = dto.country,
                    currency = dto.currency
                )
            }
        }
    }

    override suspend fun getCountries(): NetworkResult<List<Country>> {
        return safeApiCall {
            val dtos = api.getCountries()
            dtos.map { dto ->
                Country(
                    code = dto.code,
                    name = dto.name,
                    currency = dto.currency,
                    accountType = dto.accountType
                )
            }
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
            // CRITICAL: Block if offline
            offlineModeGuard.requireOnlineForFinancialTransaction()
            
            // Validate amount
            val validation = financialSecurity.validateAmount(
                amount = fiatAmount.toDouble(),
                minAmount = 5.0,
                maxAmount = 50000.0
            )
            if (!validation.isValid) {
                throw IllegalArgumentException(validation.message)
            }
            
            // Get current user ID
            val userSession = tokenManager.getUserSession()
                ?: throw IllegalStateException("User session not found")
            
            // Generate nonce and timestamp
            val nonce = com.krieta.com.core.security.WithdrawalSecurity.generateNonce()
            val timestamp = com.krieta.com.core.util.currentTimeMillis()
            val signature = financialSecurity.signTopUp(
                userId = userSession.userId,
                amount = fiatAmount.toDouble(),
                currency = currency,
                paymentMethod = provider,
                nonce = nonce,
                timestamp = timestamp
            ) ?: throw IllegalStateException("Session expired. Please login again.")
            
            val request = TopupInitiateRequestDto(
                fiatAmount = fiatAmount,
                currency = currency,
                provider = provider,
                phoneNumber = phoneNumber,
                email = email
            )
            val response = api.initiateTopup(request)
            
            TopupInitiateResponse(
                transactionId = response.transactionId ?: "",
                reference = response.reference ?: "",
                krAmount = response.krAmount ?: 0,
                fiatAmount = response.fiatAmount ?: 0,
                currency = response.currency ?: "",
                provider = response.provider ?: "",
                status = response.status ?: "",
                paymentInstructions = PaymentInstructions(
                    provider = response.paymentInstructions?.provider ?: "",
                    amount = response.paymentInstructions?.amount?.toString() ?: "",
                    currency = response.paymentInstructions?.currency ?: "",
                    instructions = response.paymentInstructions?.instructions ?: "",
                    phoneNumber = response.paymentInstructions?.phoneNumber,
                    paybill = response.paymentInstructions?.paybill,
                    accountNumber = response.paymentInstructions?.accountNumber,
                    paymentUrl = response.paymentInstructions?.paymentUrl
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
