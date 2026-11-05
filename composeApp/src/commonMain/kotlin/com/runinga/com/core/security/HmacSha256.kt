package com.runinga.com.core.security

expect object HmacSha256 {
    fun sign(message: String, secret: String): ByteArray
}
