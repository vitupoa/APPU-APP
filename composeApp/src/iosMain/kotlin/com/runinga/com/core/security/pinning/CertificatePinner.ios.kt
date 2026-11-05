package com.runinga.com.core.security.pinning

import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.darwin.Darwin
import io.ktor.client.engine.darwin.DarwinClientEngineConfig
import platform.Foundation.*
import platform.Security.*
import kotlinx.cinterop.*

actual fun createCertificatePinner(): CertificatePinner = IosCertificatePinner()

class IosCertificatePinner : CertificatePinner {
    
    override fun configurePinning(config: HttpClientConfig<*>) {
        if (!CertificatePinningConfig.PINNING_ENABLED) {
            println("⚠️ Certificate pinning is DISABLED")
            return
        }
        
        config.apply {
            engine {
                if (this is DarwinClientEngineConfig) {
                    handleChallenge { session, task, challenge, completionHandler ->
                        val protectionSpace = challenge.protectionSpace
                        val authMethod = protectionSpace.authenticationMethod
                        
                        // Only handle server trust authentication
                        if (authMethod == NSURLAuthenticationMethodServerTrust) {
                            val serverTrust = protectionSpace.serverTrust
                            val host = protectionSpace.host
                            
                            if (serverTrust != null && host == CertificatePinningConfig.API_HOSTNAME) {
                                if (validateServerTrust(serverTrust, host)) {
                                    // Pin validation passed - accept the challenge
                                    val credential = NSURLCredential.credentialForTrust(serverTrust)
                                    completionHandler(NSURLSessionAuthChallengeUseCredential, credential)
                                    println("✅ Certificate pinning validation passed for $host")
                                } else {
                                    // Pin validation failed - reject the challenge
                                    completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, null)
                                    println("❌ Certificate pinning validation FAILED for $host")
                                }
                            } else {
                                // Not our pinned host - use default handling
                                completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, null)
                            }
                        } else {
                            // Other auth methods - use default handling
                            completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, null)
                        }
                    }
                }
            }
        }
        
        println("✅ Certificate pinning configured for iOS (${CertificatePinningConfig.API_HOSTNAME})")
    }
    
    override fun validateCertificate(hostname: String, pins: List<String>): Boolean {
        // This is called from the challenge handler
        return true
    }
    
    /**
     * Validates the server trust against our pinned certificates
     */
    @OptIn(ExperimentalForeignApi::class)
    private fun validateServerTrust(serverTrust: SecTrustRef, hostname: String): Boolean {
        // Evaluate the trust
        memScoped {
            val result = alloc<SecTrustResultTypeVar>()
            val status = SecTrustEvaluate(serverTrust, result.ptr)
            
            if (status != errSecSuccess) {
                println("❌ SecTrustEvaluate failed with status: $status")
                return false
            }
            
            // Check if trust evaluation passed
            val trustResult = result.value
            if (trustResult != kSecTrustResultUnspecified && trustResult != kSecTrustResultProceed) {
                println("❌ Trust evaluation failed with result: $trustResult")
                return false
            }
        }
        
        // Extract public keys from the certificate chain
        val certificateCount = SecTrustGetCertificateCount(serverTrust)
        if (certificateCount == 0L) {
            println("❌ No certificates in chain")
            return false
        }
        
        // Check each certificate in the chain
        for (i in 0 until certificateCount.toInt()) {
            val certificate = SecTrustGetCertificateAtIndex(serverTrust, i.toLong())
            if (certificate != null) {
                val publicKeyHash = extractPublicKeyHash(certificate)
                if (publicKeyHash != null) {
                    val formattedPin = "sha256/$publicKeyHash"
                    if (CertificatePinningConfig.CERTIFICATE_PINS.contains(formattedPin)) {
                        println("✅ Certificate pin matched: $formattedPin (position $i in chain)")
                        return true
                    }
                }
            }
        }
        
        println("❌ No matching certificate pins found in chain")
        return false
    }
    
    /**
     * Extracts the public key hash (SHA-256) from a certificate
     */
    @OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
    private fun extractPublicKeyHash(certificate: SecCertificateRef): String? {
        // Get the public key from the certificate
        val publicKey = SecCertificateCopyKey(certificate)
        if (publicKey == null) {
            println("⚠️ Could not extract public key from certificate")
            return null
        }
        
        // Get the public key data
        memScoped {
            val error = alloc<ObjCObjectVar<CFErrorRef?>>()
            val publicKeyData = SecKeyCopyExternalRepresentation(publicKey, error.ptr)
            
            if (publicKeyData == null) {
                println("⚠️ Could not get public key data: ${error.value}")
                CFRelease(publicKey)
                return null
            }
            
            // Hash the public key data with SHA-256
            val hash = hashPublicKeyData(publicKeyData)
            
            CFRelease(publicKey)
            CFRelease(publicKeyData)
            
            return hash
        }
    }
    
    /**
     * Hashes public key data using SHA-256 and returns base64-encoded string
     */
    @OptIn(ExperimentalForeignApi::class)
    private fun hashPublicKeyData(data: CFDataRef): String {
        val length = CFDataGetLength(data).toInt()
        val bytes = CFDataGetBytePtr(data)
        
        // Create NSData from the bytes
        val nsData = NSData.create(bytes = bytes, length = length.toULong())
        
        // Compute SHA-256 hash
        val hash = memScoped {
            val hashBytes = allocArray<UByteVar>(CC_SHA256_DIGEST_LENGTH)
            CC_SHA256(nsData.bytes, nsData.length.toUInt(), hashBytes)
            
            // Convert to NSData
            NSData.create(bytes = hashBytes, length = CC_SHA256_DIGEST_LENGTH.toULong())
        }
        
        // Base64 encode
        return hash.base64EncodedStringWithOptions(0)
    }
}

// SHA-256 constants for iOS
const val CC_SHA256_DIGEST_LENGTH = 32

@OptIn(ExperimentalForeignApi::class)
external fun CC_SHA256(
    data: CPointer<*>?,
    len: UInt,
    md: CPointer<UByteVar>?
): CPointer<UByteVar>?
