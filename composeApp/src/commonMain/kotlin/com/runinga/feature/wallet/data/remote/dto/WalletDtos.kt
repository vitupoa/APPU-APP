package com.runinga.feature.wallet.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class WalletBalanceDto(
    val krBalance: Double,
    val fiatEquivalent: Double,
    val currency: String,
    val isWalletUnlocked: Boolean,
    // Wave 3 Task 5.3: Exchange rate metadata
    val exchangeRate: Double? = null,
    val baseUsd: Double? = null
)

@Serializable
data class TipRequestDto(
    val recipientId: String,
    val krAmount: Double,
    val currency: String,
    // MITM protection: HMAC signature over (recipientId, krAmount, currency, timestamp, nonce)
    val signature: String,
    val timestamp: Long,
    val nonce: String
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
    val createdAt: String,
    // Wave 3 Task 5.3: Fiat conversion metadata
    val fiatEquivalent: Double? = null,
    val exchangeRate: Double? = null,
    // Wave 1 Task 2.1: Transaction context
    val contextType: String? = null,
    val contextRefId: String? = null,
    val contextDesc: String? = null
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
    val krReceived: Double? = null,
    val platformFee: Double? = null,
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

@Serializable
data class WithdrawRequestDto(
    val provider: String, // mpesa, paystack, bank
    val krAmount: Double,
    val currency: String,
    val phoneNumber: String? = null, // For M-Pesa
    val accountNumber: String? = null, // For Bank/Paystack
    val bankCode: String? = null, // For Bank/Paystack
    val accountName: String? = null, // For Bank/Paystack - must match user's name
    val country: String? = null, // For Paystack
    val deviceSecurityScore: Int? = null,
    val isRooted: Boolean? = null,
    val isEmulator: Boolean? = null,
    // Security: Amount validation hash to prevent tampering
    val amountHash: String,
    // Security: Timestamp to prevent replay attacks
    val requestTimestamp: Long,
    // Security: Client-side balance check hash
    val balanceHash: String
)

@Serializable
data class WithdrawResponseDto(
    val success: Boolean,
    val transactionId: String? = null,
    val message: String? = null,
    val error: String? = null,
    val processingTime: String? = null
)

@Serializable
data class BankDto(
    val name: String,
    val code: String,
    val country: String,
    val currency: String
)

@Serializable
data class CountryDto(
    val code: String,
    val name: String,
    val currency: String,
    val accountType: String
)

@Serializable
data class AccountVerificationDto(
    val accountNumber: String,
    val bankCode: String,
    val country: String
)

@Serializable
data class AccountVerificationResponseDto(
    val success: Boolean,
    val accountName: String? = null,
    val error: String? = null
)
