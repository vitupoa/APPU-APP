package com.krieta.feature.wallet.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class WalletBalanceDto(
    val krBalance: Double,
    val fiatEquivalent: Double,
    val currency: String,
    val isWalletUnlocked: Boolean
)

@Serializable
data class TipRequestDto(
    val recipientId: String,
    val fiatAmount: Double,
    val currency: String
)

@Serializable
data class TransactionDto(
    val id: String,
    val userId: String,
    val type: String,
    val amountKr: Double,
    val amountFiat: Double?,
    val currency: String?,
    val provider: String?,
    val status: String,
    val reference: String?,
    val counterpartyId: String?,
    val createdAt: String
)

@Serializable
data class ExchangeRateResponseDto(
    val currency: String,
    val baseRate: Double,
    val buyRate: Double,
    val sellRate: Double,
    val margin: String
)

@Serializable
data class TipResponseDto(
    val success: Boolean,
    val krTipped: Double? = null,
    val error: String? = null
)

@Serializable
data class TopupInitiateRequestDto(
    val fiatAmount: Int,
    val currency: String,
    val provider: String,
    val phoneNumber: String? = null,
    val email: String? = null
)

@Serializable
data class TopupInitiateResponseDto(
    val success: Boolean,
    val transactionId: String? = null,
    val reference: String? = null,
    val krAmount: Int? = null,
    val fiatAmount: Int? = null,
    val currency: String? = null,
    val provider: String? = null,
    val status: String? = null,
    val paymentInstructions: PaymentInstructionsDto? = null,
    val error: String? = null
)

@Serializable
data class PaymentInstructionsDto(
    val provider: String,
    val amount: Int,
    val currency: String,
    val instructions: String,
    val phoneNumber: String? = null,
    val paybill: String? = null,
    val accountNumber: String? = null,
    val paymentUrl: String? = null
)

@Serializable
data class TopupConfirmRequestDto(
    val transactionId: String,
    val reference: String? = null
)

@Serializable
data class TopupConfirmResponseDto(
    val success: Boolean,
    val transactionId: String,
    val krAmount: Int,
    val status: String
)
