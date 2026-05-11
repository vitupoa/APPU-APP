package com.krieta.com.core.security

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

/**
 * Secure HMAC-SHA256 implementation
 * NO hardcoded secrets - keys must be provided at runtime
 */
object SecureHmac {
    
    private const val HMAC_ALGORITHM = "HmacSHA256"
    
    /**
     * Generate HMAC-SHA256 signature
     * @param message Data to sign
     * @param secret Secret key (must be provided by server, never hardcoded)
     * @return Base64-encoded signature
     */
    @OptIn(ExperimentalEncodingApi::class)
    fun sign(message: String, secret: ByteArray): String {
        require(secret.isNotEmpty()) { "Secret key cannot be empty" }
        require(secret.size >= 32) { "Secret key must be at least 256 bits (32 bytes)" }
        
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        val secretKey = SecretKeySpec(secret, HMAC_ALGORITHM)
        mac.init(secretKey)
        
        val signature = mac.doFinal(message.toByteArray(Charsets.UTF_8))
        return Base64.encode(signature)
    }
    
    /**
     * Verify HMAC-SHA256 signature
     * @param message Original data
     * @param signature Signature to verify
     * @param secret Secret key
     * @return true if signature is valid
     */
    fun verify(message: String, signature: String, secret: ByteArray): Boolean {
        return try {
            val expectedSignature = sign(message, secret)
            constantTimeEquals(signature, expectedSignature)
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) return false
        
        var result = 0
        for (i in a.indices) {
            result = result or (a[i].code xor b[i].code)
        }
        return result == 0
    }
}
