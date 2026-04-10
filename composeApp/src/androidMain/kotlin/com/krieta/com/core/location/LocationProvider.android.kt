package com.krieta.com.core.location

actual class LocationProvider actual constructor() {
    actual fun getCurrentCountry(): String {
        return java.util.Locale.getDefault().country.ifEmpty { "US" }
    }

    actual fun getCurrentCurrency(): String {
        return try {
            java.util.Currency.getInstance(java.util.Locale.getDefault()).currencyCode
        } catch (_: Exception) {
            CurrencyMapper.getCurrencyForCountry(getCurrentCountry())
        }
    }
}
