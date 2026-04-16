package com.krieta.com.core.location

/**
 * Platform-specific location/country detection.
 * - Android: uses TelephonyManager (SIM country) with locale fallback
 * - iOS: uses NSLocale region settings
 *
 * Constructed via Koin with platform-specific dependencies.
 */
expect class LocationProvider {
    fun getCurrentCountry(): String
    fun getCurrentCurrency(): String
}
