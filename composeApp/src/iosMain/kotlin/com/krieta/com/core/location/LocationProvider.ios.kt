package com.krieta.com.core.location

import platform.Foundation.NSLocale
import platform.Foundation.countryCode
import platform.Foundation.currencyCode
import platform.Foundation.currentLocale

actual class LocationProvider actual constructor() {
    actual fun getCurrentCountry(): String {
        return NSLocale.currentLocale.countryCode ?: "US"
    }

    actual fun getCurrentCurrency(): String {
        return NSLocale.currentLocale.currencyCode
            ?: CurrencyMapper.getCurrencyForCountry(getCurrentCountry())
    }
}
