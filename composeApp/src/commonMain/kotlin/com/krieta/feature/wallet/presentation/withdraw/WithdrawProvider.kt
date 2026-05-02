package com.krieta.feature.wallet.presentation.withdraw

enum class WithdrawProvider(val displayName: String, val id: String) {
    MPESA("M-Pesa", "mpesa"),
    PAYPAL("PayPal", "paypal"),
    PAYSTACK("Paystack", "paystack")
}
