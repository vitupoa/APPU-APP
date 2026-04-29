package com.krieta.com.core.security

import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi
import kotlin.random.Random
import kotlinx.datetime.Clock

expect object HmacSha256 {
    fun sign(message: String, secret: String): ByteArray
}

expect object SecureConfig {
    val TRANSACTION_SIGNING_SECRET: String
}

object TransactionSigner {
    private val SECRET get() = SecureConfig.TRANSACTION_SIGNING_SECRET

    @OptIn(ExperimentalEncodingApi::class)
    fun generateNonce(): String {
        val bytes = ByteArray(16)
        Random.Default.nextBytes(bytes)
        return Base64.Default.encode(bytes)
    }

    fun generateTimestamp(): Long {
        return kotlinx.datetime.Clock.System.now().toEpochMilliseconds()
    }

    @OptIn(ExperimentalEncodingApi::class)
    fun signWithdrawal(
            krAmount: Double,
            provider: String,
            currency: String,
            timestamp: Long,
            nonce: String
    ): String {
        val canonical =
                createCanonicalString(
                        krAmount = krAmount,
                        provider = provider,
                        currency = currency,
                        timestamp = timestamp,
                        nonce = nonce
                )

        val signature = HmacSha256.sign(canonical, SECRET)
        return Base64.Default.encode(signature)
    }

    private fun createCanonicalString(
            krAmount: Double,
            provider: String,
            currency: String,
            timestamp: Long,
            nonce: String
    ): String {
        return "krAmount=$krAmount&provider=$provider&currency=$currency&timestamp=$timestamp&nonce=$nonce"
    }
}
