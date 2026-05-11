package com.krieta.com.core.security

expect object SecureConfig {
    val TRANSACTION_SIGNING_SECRET: String
    val HMAC_SECRET: String
    
    fun rotateHmacSecret()
    fun clearSecrets()
}
