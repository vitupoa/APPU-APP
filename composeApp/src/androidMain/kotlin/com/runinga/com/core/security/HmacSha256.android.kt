package com.runinga.com.core.security

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

actual object HmacSha256 {
    actual fun sign(message: String, secret: String): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        val secretKey = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(secretKey)
        return mac.doFinal(message.toByteArray(Charsets.UTF_8))
    }
}
