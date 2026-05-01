package com.krieta.com.core.security

/**
 * Fallback authentication manager for devices without biometric support
 * Uses PIN/Password as alternative authentication method
 */
interface FallbackAuthenticator {
    /**
     * Check if device has any authentication method available
     */
    suspend fun hasAuthenticationMethod(): Boolean
    
    /**
     * Authenticate with fallback method (PIN/Password)
     */
    suspend fun authenticateWithFallback(
        title: String,
        message: String
    ): BiometricResult
}

/**
 * Unified authentication manager that handles both biometric and fallback
 */
class UnifiedAuthenticator(
    private val biometricAuthenticator: BiometricAuthenticator,
    private val fallbackAuthenticator: FallbackAuthenticator
) {
    
    /**
     * Authenticate user with best available method
     * Priority: Biometric > PIN/Password > Error
     */
    suspend fun authenticate(
        title: String,
        subtitle: String,
        description: String
    ): AuthenticationResult {
        
        // Try biometric first
        if (biometricAuthenticator.isBiometricAvailable()) {
            return when (val result = biometricAuthenticator.authenticateForTransaction(
                title, subtitle, description
            )) {
                is BiometricResult.Success -> AuthenticationResult.Success(AuthMethod.BIOMETRIC)
                is BiometricResult.Cancelled -> AuthenticationResult.Cancelled
                is BiometricResult.Error -> {
                    // Try fallback on error
                    tryFallback(title, "$subtitle\n$description")
                }
                is BiometricResult.NotAvailable -> {
                    // Try fallback if biometric not available
                    tryFallback(title, "$subtitle\n$description")
                }
            }
        }
        
        // No biometric, try fallback
        return tryFallback(title, "$subtitle\n$description")
    }
    
    private suspend fun tryFallback(title: String, message: String): AuthenticationResult {
        if (!fallbackAuthenticator.hasAuthenticationMethod()) {
            return AuthenticationResult.Error("No authentication method available. Please set up device lock.")
        }
        
        return when (val result = fallbackAuthenticator.authenticateWithFallback(title, message)) {
            is BiometricResult.Success -> AuthenticationResult.Success(AuthMethod.PIN)
            is BiometricResult.Cancelled -> AuthenticationResult.Cancelled
            is BiometricResult.Error -> AuthenticationResult.Error(result.message)
            is BiometricResult.NotAvailable -> AuthenticationResult.Error("No authentication available")
        }
    }
    
    /**
     * Get available authentication methods
     */
    suspend fun getAvailableMethods(): List<AuthMethod> {
        val methods = mutableListOf<AuthMethod>()
        
        if (biometricAuthenticator.isBiometricAvailable()) {
            methods.add(AuthMethod.BIOMETRIC)
        }
        
        if (fallbackAuthenticator.hasAuthenticationMethod()) {
            methods.add(AuthMethod.PIN)
        }
        
        return methods
    }
}

enum class AuthMethod {
    BIOMETRIC,  // Face ID, Touch ID, Fingerprint
    PIN,        // Device PIN/Password
    NONE        // No authentication available
}

sealed class AuthenticationResult {
    data class Success(val method: AuthMethod) : AuthenticationResult()
    object Cancelled : AuthenticationResult()
    data class Error(val message: String) : AuthenticationResult()
}
