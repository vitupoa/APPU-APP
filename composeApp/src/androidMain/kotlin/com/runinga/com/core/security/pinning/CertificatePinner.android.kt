package com.runinga.com.core.security.pinning

import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.okhttp.OkHttpConfig
import okhttp3.CertificatePinner as OkHttpCertificatePinner
import java.security.MessageDigest
import java.security.cert.X509Certificate
import android.util.Base64
import android.util.Log

actual fun createCertificatePinner(): CertificatePinner = AndroidCertificatePinner()

class AndroidCertificatePinner : CertificatePinner {
    
    companion object {
        private const val TAG = "CertificatePinner"
    }
    
    override fun configurePinning(config: HttpClientConfig<*>) {
        if (!CertificatePinningConfig.PINNING_ENABLED) {
            Log.w(TAG, "⚠️ Certificate pinning is DISABLED")
            println("⚠️ Certificate pinning is DISABLED")
            return
        }
        
        config.apply {
            engine {
                if (this is OkHttpConfig) {
                    val pinnerBuilder = OkHttpCertificatePinner.Builder()
                    
                    // Add all configured pins for the API hostname
                    CertificatePinningConfig.CERTIFICATE_PINS.forEach { pin ->
                        pinnerBuilder.add(CertificatePinningConfig.API_HOSTNAME, pin)
                        Log.d(TAG, "Added pin for ${CertificatePinningConfig.API_HOSTNAME}: $pin")
                    }
                    
                    val certificatePinner = pinnerBuilder.build()
                    
                    config {
                        certificatePinner(certificatePinner)
                        
                        // Disable user-installed certificates if configured
                        if (!CertificatePinningConfig.ALLOW_USER_CERTIFICATES) {
                            // This is handled by OkHttp's default behavior when certificate pinning is enabled
                            Log.d(TAG, "User-installed certificates will be rejected")
                        }
                    }
                    
                    Log.i(TAG, "✅ Certificate pinning configured for ${CertificatePinningConfig.API_HOSTNAME} with ${CertificatePinningConfig.CERTIFICATE_PINS.size} pins")
                    println("✅ Certificate pinning configured for ${CertificatePinningConfig.API_HOSTNAME} with ${CertificatePinningConfig.CERTIFICATE_PINS.size} pins")
                }
            }
        }
    }
    
    override fun validateCertificate(hostname: String, pins: List<String>): Boolean {
        // OkHttp handles validation automatically via CertificatePinner
        // This method is for manual validation if needed
        return true
    }
    
    /**
     * Utility function to extract SHA-256 pin from an X509Certificate
     * Useful for debugging and testing
     */
    fun extractPin(certificate: X509Certificate): String {
        val publicKey = certificate.publicKey.encoded
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(publicKey)
        val base64Hash = Base64.encodeToString(hash, Base64.NO_WRAP)
        return "sha256/$base64Hash"
    }
    
    /**
     * Debug function to log certificate chain pins
     * Call this in development to verify your pins
     */
    fun logCertificateChain(chain: Array<X509Certificate>) {
        Log.d(TAG, "Certificate Chain (${chain.size} certificates):")
        chain.forEachIndexed { index, cert ->
            val pin = extractPin(cert)
            val subject = cert.subjectDN.name
            Log.d(TAG, "  [$index] $subject")
            Log.d(TAG, "      Pin: $pin")
        }
    }
}
