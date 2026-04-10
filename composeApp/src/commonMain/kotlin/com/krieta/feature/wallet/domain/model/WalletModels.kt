package com.krieta.feature.wallet.domain.model

data class WalletBalance(
    val krBalance: Double,
    val fiatEquivalent: Double,
    val currency: String,
    val isWalletUnlocked: Boolean
)

data class Transaction(
    val id: String,
    val userId: String,
    val type: TransactionType,
    val amountKr: Double,
    val amountFiat: Double?,
    val currency: String?,
    val provider: String?,
    val status: TransactionStatus,
    val reference: String?,
    val counterpartyId: String?,
    val createdAt: String
)

enum class TransactionType {
    TOPUP, WITHDRAW, TIP_SENT, TIP_RECEIVED, 
    CONTEST_ESCROW, CONTEST_PRIZE, 
    SUBSCRIPTION_EARNED, SUBSCRIPTION_PAID, 
    SHOP_SALE, AD_REVENUE, PLATFORM_FEE, UNKNOWN
}

enum class TransactionStatus {
    PENDING, COMPLETED, FAILED, CANCELLED, UNKNOWN
}

data class ExchangeRate(
    val currency: String,
    val baseRate: Double,
    val buyRate: Double,
    val sellRate: Double,
    val margin: String
)
