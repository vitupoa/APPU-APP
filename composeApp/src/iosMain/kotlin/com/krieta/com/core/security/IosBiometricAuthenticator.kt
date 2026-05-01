package com.krieta.com.core.security

import kotlinx.coroutines.suspendCancellableCoroutine
import platform.LocalAuthentication.LAContext
import platform.LocalAuthentication.LAPolicyDeviceOwnerAuthentication
import kotlin.coroutines.resume

class IosBiometricAuthenticator : BiometricAuthenticator {

    override suspend fun isBiometricAvailable(): Boolean {
        val context = LAContext()
        return context.canEvaluatePolicy(
            LAPolicyDeviceOwnerAuthentication,
            error = null
        )
    }

    override suspend fun authenticateForTransaction(
        title: String,
        subtitle: String,
        description: String
    ): BiometricResult = suspendCancellableCoroutine { continuation ->
        
        val context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"
        
        val reason = "$subtitle\n$description"
        
        context.evaluatePolicy(
            LAPolicyDeviceOwnerAuthentication,
            localizedReason = reason
        ) { success, error ->
            if (continuation.isActive) {
                when {
                    success -> {
                        continuation.resume(BiometricResult.Success)
                    }
                    error != null -> {
                        val errorCode = error.code
                        when (errorCode) {
                            -2L -> { // LAErrorUserCancel
                                continuation.resume(BiometricResult.Cancelled)
                            }
                            -1L, -6L, -7L -> { // LAErrorAuthenticationFailed, LAErrorBiometryNotAvailable, LAErrorBiometryNotEnrolled
                                continuation.resume(BiometricResult.NotAvailable)
                            }
                            else -> {
                                continuation.resume(
                                    BiometricResult.Error(
                                        error.localizedDescription ?: "Authentication failed"
                                    )
                                )
                            }
                        }
                    }
                    else -> {
                        continuation.resume(BiometricResult.Error("Unknown error"))
                    }
                }
            }
        }
    }
}
