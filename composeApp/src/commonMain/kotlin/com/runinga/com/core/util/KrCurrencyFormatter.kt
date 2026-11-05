package com.runinga.com.core.util

import kotlin.math.roundToInt

object RcCurrencyFormatter {
    /**
     * Formats a Rc amount: Rc. 500, Rc. 0.50, Rc. 1
     * Always: symbol DOT SPACE amount
     */
    fun formatKr(amount: Double): String {
        return if (amount == amount.toLong().toDouble()) {
            "Rc. ${amount.toLong()}"
        } else {
            val rounded = (amount * 100).roundToInt() / 100.0
            "Rc. ${rounded.toString().trimEnd('0').trimEnd('.')}"
        }
    }

    /**
     * Formats Rc with fiat equivalent: Rc. 500 (~KES 850)
     */
    fun formatKrWithFiat(
        krAmount: Double,
        fiatAmount: Double,
        currencyCode: String
    ): String {
        val krFormatted = formatKr(krAmount)
        val fiatFormatted = formatFiat(fiatAmount, currencyCode)
        return "$krFormatted (~$fiatFormatted)"
    }

    /**
     * Formats fiat amount with currency code: KES 850, USD 10.50
     */
    fun formatFiat(amount: Double, currencyCode: String): String {
        return if (amount == amount.toLong().toDouble()) {
            "$currencyCode ${amount.toLong()}"
        } else {
            val rounded = (amount * 100).roundToInt() / 100.0
            "$currencyCode $rounded"
        }
    }

    /**
     * Converts fiat to Rc using exchange rate with platform margin.
     * NEW TOKENOMICS: 1 Rc = 1 KES, 1 USD = 135 KES, therefore 1 Rc = 1/135 USD
     * 
     * rate = USD to local fiat (e.g., 135 for KES)
     * To convert fiat to Rc: fiat / rate (since 1 Rc = 1 KES and rate is KES per USD)
     * 
     * Buy margin (topup): User gets LESS Rc (rate increased by 4.5%)
     * Sell margin (withdraw): User gets LESS fiat (rate increased by 4.5%)
     */
    fun fiatToKr(fiatAmount: Double, rate: Double, applyBuyMargin: Boolean = true): Double {
        val effectiveRate = if (applyBuyMargin) rate * (1 + PLATFORM_MARGIN) else rate
        return if (effectiveRate > 0) fiatAmount / effectiveRate else 0.0
    }

    fun krToFiat(krAmount: Double, rate: Double, applySellMargin: Boolean = true): Double {
        val effectiveRate = if (applySellMargin) rate * (1 - PLATFORM_MARGIN) else rate
        return krAmount * effectiveRate
    }

    /**
     * Formats a display-only Rc conversion (no margin, for display purposes)
     */
    fun formatDisplayConversion(krAmount: Double, rate: Double, currencyCode: String): String {
        val fiatAmount = krToFiat(krAmount, rate, applySellMargin = false)
        return formatKrWithFiat(krAmount, fiatAmount, currencyCode)
    }

    /**
     * Platform fee calculation (15% for contests and subscriptions)
     */
    fun calculatePlatformFee(amount: Double): Double {
        return amount * PLATFORM_FEE_RATE
    }

    fun formatWithPlatformFee(prizeKr: Double, currencyCode: String, rate: Double): String {
        val fee = calculatePlatformFee(prizeKr)
        val total = prizeRc + fee
        return "Prize: ${formatKr(prizeKr)} + Fee: ${formatKr(fee)} = Total: ${formatKr(total)}"
    }

    const val PLATFORM_MARGIN = 0.045  // 4.5% buy/sell margin
    const val PLATFORM_FEE_RATE = 0.15 // 15% platform fee (contests, subscriptions)
}
