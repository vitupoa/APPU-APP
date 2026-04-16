package com.krieta.com.core.location

import android.content.Context
import android.telephony.TelephonyManager

actual class LocationProvider(private val context: Context) {

    actual fun getCurrentCountry(): String {
        // Priority: SIM country > Network country > Locale
        return getSimCountry()
            ?: getNetworkCountry()
            ?: java.util.Locale.getDefault().country.ifEmpty { "US" }
    }

    actual fun getCurrentCurrency(): String {
        val country = getCurrentCountry()
        return CurrencyMapper.getCurrencyForCountry(country)
    }

    private fun getSimCountry(): String? {
        return try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            tm?.simCountryIso?.uppercase()?.takeIf { it.length == 2 }
        } catch (_: Exception) {
            null
        }
    }

    private fun getNetworkCountry(): String? {
        return try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            tm?.networkCountryIso?.uppercase()?.takeIf { it.length == 2 }
        } catch (_: Exception) {
            null
        }
    }
}
