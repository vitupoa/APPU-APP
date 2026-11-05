package com.runinga.com.core.location

import platform.CoreTelephony.CTTelephonyNetworkInfo
import platform.Foundation.NSLocale
import platform.Foundation.countryCode
import platform.Foundation.currencyCode
import platform.Foundation.currentLocale

actual class LocationProvider {
    actual fun getCurrentCountry(): String {
        // Priority: carrier country > locale region
        return getCarrierCountry()
            ?: NSLocale.currentLocale.countryCode?.uppercase()
            ?: "US"
    }

    actual fun getCurrentCurrency(): String {
        val country = getCurrentCountry()
        return CurrencyMapper.getCurrencyForCountry(country)
    }

    private fun getCarrierCountry(): String? {
        return try {
            val networkInfo = CTTelephonyNetworkInfo()
            val carriers = networkInfo.serviceSubscriberCellularProviders
            val carrier = carriers?.values?.firstOrNull() as? platform.CoreTelephony.CTCarrier
            carrier?.isoCountryCode?.uppercase()?.takeIf { it.length == 2 }
        } catch (_: Exception) {
            null
        }
    }
}
