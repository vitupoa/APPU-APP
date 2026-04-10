package com.krieta.com.core.location

expect class LocationProvider() {
    fun getCurrentCountry(): String
    fun getCurrentCurrency(): String
}
