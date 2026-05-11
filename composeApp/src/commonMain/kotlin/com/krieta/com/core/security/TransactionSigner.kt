package com.krieta.com.core.security

import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi
import kotlin.random.Random
import kotlinx.datetime.Clock

/**
 * DEPRECATED: Use FinancialTransactionSecurity instead
 * 
 * This class had hardcoded secrets which is a security vulnerability.
 * The new implementation uses server-provided session secrets.
 */
@Deprecated(
    message = "Use FinancialTransactionSecurity instead - this class has hardcoded secrets",
    replaceWith = ReplaceWith("FinancialTransactionSecurity"),
    level = DeprecationLevel.ERROR
)
object TransactionSigner {
    
    @OptIn(ExperimentalEncodingApi::class)
    fun generateNonce(): String {
        val bytes = ByteArray(16)
        Random.Default.nextBytes(bytes)
        return Base64.Default.encode(bytes)
    }

    fun generateTimestamp(): Long = Clock.System.now().toEpochMilliseconds()
}
