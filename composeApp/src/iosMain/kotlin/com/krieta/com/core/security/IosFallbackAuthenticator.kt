package com.krieta.com.core.security

import kotlinx.coroutines.suspendCancellableCoroutine
import platform.LocalAuthentication.LAContext
import platform.LocalAuthentication.LAPolicyDeviceOwnerAuthentication
import kotlin.coroutines.resume

class IosFallbackAuthenticator : FallbackAuthenticator {
    
    override suspend fun hasAuthenticationMethod(): Boolean {
        val context = LAContext()
        return context.canEvaluatePolicy(
            LAPolicyDeviceOwnerAuthentication,
            error = null
        )
    }
    
    override suspend fun authenticateWithFallback(
        title: String,
        message: String
    ): BiometricResult = suspendCancellableCoroutine { continuation ->
        
        val context = LAContext()
        
        // LAPolicyDeviceOwnerAuthentication allows both biometric and passcode
        context.evaluatePolicy(
            LAPolicyDeviceOwnerAuthentication,
            localizedReason = message
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
