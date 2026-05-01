package com.krieta.com.core.security

/**
 * Biometric authentication interface for transaction-level security
 */
interface BiometricAuthenticator {
    /**
     * Check if biometric authentication is available on device
     */
    suspend fun isBiometricAvailable(): Boolean
    
    /**
     * Authenticate user with biometric before transaction
     * @param title Dialog title
     * @param subtitle Dialog subtitle
     * @param description Transaction description
     * @return true if authentication successful
     */
    suspend fun authenticateForTransaction(
        title: String,
        subtitle: String,
        description: String
    ): BiometricResult
}

sealed class BiometricResult {
    object Success : BiometricResult()
    data class Error(val message: String) : BiometricResult()
    object Cancelled : BiometricResult()
    object NotAvailable : BiometricResult()
}
