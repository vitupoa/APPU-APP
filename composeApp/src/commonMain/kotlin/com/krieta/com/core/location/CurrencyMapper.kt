package com.krieta.com.core.location

object CurrencyMapper {
    private val countryToCurrency = mapOf(
        "AF" to "AFN", "AL" to "ALL", "DZ" to "DZD", "AO" to "AOA",
        "AR" to "ARS", "AM" to "AMD", "AU" to "AUD", "AT" to "EUR",
        "AZ" to "AZN", "BH" to "BHD", "BD" to "BDT", "BE" to "EUR",
        "BJ" to "XOF", "BO" to "BOB", "BA" to "BAM", "BW" to "BWP",
        "BR" to "BRL", "BN" to "BND", "BG" to "BGN", "BF" to "XOF",
        "BI" to "BIF", "KH" to "KHR", "CM" to "XAF", "CA" to "CAD",
        "CF" to "XAF", "TD" to "XAF", "CL" to "CLP", "CN" to "CNY",
        "CO" to "COP", "CG" to "XAF", "CD" to "CDF", "CR" to "CRC",
        "CI" to "XOF", "HR" to "EUR", "CU" to "CUP", "CY" to "EUR",
        "CZ" to "CZK", "DK" to "DKK", "DJ" to "DJF", "DO" to "DOP",
        "EC" to "USD", "EG" to "EGP", "SV" to "USD", "GQ" to "XAF",
        "ER" to "ERN", "EE" to "EUR", "SZ" to "SZL", "ET" to "ETB",
        "FI" to "EUR", "FR" to "EUR", "GA" to "XAF", "GM" to "GMD",
        "GE" to "GEL", "DE" to "EUR", "GH" to "GHS", "GR" to "EUR",
        "GT" to "GTQ", "GN" to "GNF", "HN" to "HNL", "HK" to "HKD",
        "HU" to "HUF", "IS" to "ISK", "IN" to "INR", "ID" to "IDR",
        "IR" to "IRR", "IQ" to "IQD", "IE" to "EUR", "IL" to "ILS",
        "IT" to "EUR", "JM" to "JMD", "JP" to "JPY", "JO" to "JOD",
        "KZ" to "KZT", "KE" to "KES", "KR" to "KRW", "KW" to "KWD",
        "KG" to "KGS", "LA" to "LAK", "LV" to "EUR", "LB" to "LBP",
        "LS" to "LSL", "LR" to "LRD", "LY" to "LYD", "LT" to "EUR",
        "LU" to "EUR", "MG" to "MGA", "MW" to "MWK", "MY" to "MYR",
        "ML" to "XOF", "MT" to "EUR", "MR" to "MRU", "MU" to "MUR",
        "MX" to "MXN", "MD" to "MDL", "MN" to "MNT", "MA" to "MAD",
        "MZ" to "MZN", "MM" to "MMK", "NA" to "NAD", "NP" to "NPR",
        "NL" to "EUR", "NZ" to "NZD", "NI" to "NIO", "NE" to "XOF",
        "NG" to "NGN", "NO" to "NOK", "OM" to "OMR", "PK" to "PKR",
        "PA" to "PAB", "PY" to "PYG", "PE" to "PEN", "PH" to "PHP",
        "PL" to "PLN", "PT" to "EUR", "QA" to "QAR", "RO" to "RON",
        "RU" to "RUB", "RW" to "RWF", "SA" to "SAR", "SN" to "XOF",
        "RS" to "RSD", "SL" to "SLL", "SG" to "SGD", "SK" to "EUR",
        "SI" to "EUR", "SO" to "SOS", "ZA" to "ZAR", "SS" to "SSP",
        "ES" to "EUR", "LK" to "LKR", "SD" to "SDG", "SE" to "SEK",
        "CH" to "CHF", "SY" to "SYP", "TW" to "TWD", "TJ" to "TJS",
        "TZ" to "TZS", "TH" to "THB", "TG" to "XOF", "TN" to "TND",
        "TR" to "TRY", "TM" to "TMT", "UG" to "UGX", "UA" to "UAH",
        "AE" to "AED", "GB" to "GBP", "US" to "USD", "UY" to "UYU",
        "UZ" to "UZS", "VE" to "VES", "VN" to "VND", "YE" to "YER",
        "ZM" to "ZMW", "ZW" to "ZWL"
    )

    fun getCurrencyForCountry(countryCode: String): String {
        return countryToCurrency[countryCode.uppercase()] ?: "USD"
    }

    fun isPaystackSupported(countryCode: String): Boolean {
        return countryCode.uppercase() in setOf("NG", "GH", "ZA", "KE")
    }

    fun isMpesaSupported(countryCode: String): Boolean {
        return countryCode.uppercase() == "KE"
    }

    fun getAvailableTopupMethods(countryCode: String): List<PaymentMethod> {
        val methods = mutableListOf<PaymentMethod>()
        if (isMpesaSupported(countryCode)) methods.add(PaymentMethod.MPESA)
        if (isPaystackSupported(countryCode)) methods.add(PaymentMethod.PAYSTACK)
        methods.add(PaymentMethod.PAYPAL) // Always available internationally
        return methods
    }

    fun getAvailableWithdrawMethods(countryCode: String): List<PaymentMethod> {
        val methods = mutableListOf<PaymentMethod>()
        if (isMpesaSupported(countryCode)) methods.add(PaymentMethod.MPESA)
        methods.add(PaymentMethod.PAYONEER) // Always available internationally
        return methods
    }
}

enum class PaymentMethod(val displayName: String) {
    PAYPAL("PayPal (Card)"),
    PAYSTACK("Paystack"),
    MPESA("M-Pesa"),
    PAYONEER("Payoneer")
}
