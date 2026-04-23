package com.krieta.com.core.util

import kotlin.math.roundToInt

object KrCurrencyFormatter {
    /**
     * Formats a Kr amount: Kr.500, Kr.0.50, Kr.1
     * Always: symbol DOT amount, no space
     */
    fun formatKr(amount: Double): String {
        return if (amount == amount.toLong().toDouble()) {
            "Kr.${amount.toLong()}"
        } else {
            val rounded = (amount * 100).roundToInt() / 100.0
            "Kr.${rounded.toString().trimEnd('0').trimEnd('.')}"
        }
    }

    /**
     * Formats Kr with fiat equivalent: Kr.500 (~KES 850)
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
     * Converts fiat to Kr using exchange rate with platform margin.
     * Buy margin (topup): User gets LESS Kr (rate reduced by 4.5%)
     * Sell margin (withdraw): User gets LESS fiat (rate reduced by 4.5%)
     */
    fun fiatToKr(fiatAmount: Double, rate: Double, applyBuyMargin: Boolean = true): Double {
        val baseKr = if (rate > 0) fiatAmount / (100.0 * rate) else 0.0
        return if (applyBuyMargin) baseKr * (1 - PLATFORM_MARGIN) else baseKr
    }

    fun krToFiat(krAmount: Double, rate: Double, applySellMargin: Boolean = true): Double {
        val baseFiat = krAmount * 100.0 * rate
        return if (applySellMargin) baseFiat * (1 - PLATFORM_MARGIN) else baseFiat
    }

    /**
     * Formats a display-only Kr conversion (no margin, for display purposes)
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
        val total = prizeKr + fee
        return "Prize: ${formatKr(prizeKr)} + Fee: ${formatKr(fee)} = Total: ${formatKr(total)}"
    }

    const val PLATFORM_MARGIN = 0.045  // 4.5% buy/sell margin
    const val PLATFORM_FEE_RATE = 0.15 // 15% platform fee (contests, subscriptions)
}
