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
