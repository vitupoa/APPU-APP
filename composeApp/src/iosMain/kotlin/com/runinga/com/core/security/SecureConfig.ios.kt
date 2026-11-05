package com.runinga.com.core.security

import platform.Foundation.NSUUID
import platform.Security.*

actual object SecureConfig {
    actual val TRANSACTION_SIGNING_SECRET: String = AppConfig.TRANSACTION_SIGNING_SECRET
    
    // HMAC secret should be stored in iOS Keychain
    // Generate once and store securely, never hardcode
    actual val HMAC_SECRET: String
        get() = getOrGenerateHmacSecret()
    
    private var cachedSecret: String? = null
    private const val KEYCHAIN_SERVICE = "com.runinga.app"
    private const val KEYCHAIN_ACCOUNT = "hmac_secret"
    
    private fun getOrGenerateHmacSecret(): String {
        if (cachedSecret != null) return cachedSecret!!
        
        val query = mapOf(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to KEYCHAIN_SERVICE,
            kSecAttrAccount to KEYCHAIN_ACCOUNT,
            kSecReturnData to kCFBooleanTrue,
            kSecMatchLimit to kSecMatchLimitOne
        )
        
        var secret: String? = null
        // TODO: Implement actual Keychain read
        
        if (secret == null) {
            secret = generateSecret()
            // TODO: Store in Keychain
        }
        
        cachedSecret = secret
        return secret
    }
    
    private fun generateSecret(): String {
        return NSUUID().UUIDString() + NSUUID().UUIDString()
    }
    
    actual fun rotateHmacSecret() {
        val newSecret = generateSecret()
        // TODO: Update in Keychain
        cachedSecret = newSecret
    }
    
    actual fun clearSecrets() {
        val deleteQuery = mapOf(
            kSecClass to kSecClassGenericPassword,
            kSecAttrService to KEYCHAIN_SERVICE,
            kSecAttrAccount to KEYCHAIN_ACCOUNT
        )
        // TODO: SecItemDelete(deleteQuery)
        cachedSecret = null
    }
}
