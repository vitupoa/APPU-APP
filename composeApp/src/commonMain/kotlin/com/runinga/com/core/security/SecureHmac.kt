package com.runinga.com.core.security

import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

object SecureHmac {

    @OptIn(ExperimentalEncodingApi::class)
    fun sign(message: String, secret: ByteArray): String {
        require(secret.isNotEmpty()) { "Secret key cannot be empty" }
        require(secret.size >= 32) { "Secret key must be at least 256 bits (32 bytes)" }
        val secretStr = secret.decodeToString()
        val signature = HmacSha256.sign(message, secretStr)
        return Base64.encode(signature)
    }

    fun verify(message: String, signature: String, secret: ByteArray): Boolean {
        return try {
            val expectedSignature = sign(message, secret)
            constantTimeEquals(signature, expectedSignature)
        } catch (e: Exception) {
            false
        }
    }

    private fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) return false
        var result = 0
        for (i in a.indices) {
            result = result or (a[i].code xor b[i].code)
        }
        return result == 0
    }
}
