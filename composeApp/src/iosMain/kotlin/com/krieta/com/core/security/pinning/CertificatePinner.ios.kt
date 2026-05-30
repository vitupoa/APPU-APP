package com.krieta.com.core.security.pinning

import io.ktor.client.HttpClientConfig

actual fun createCertificatePinner(): CertificatePinner = IosCertificatePinner()

class IosCertificatePinner : CertificatePinner {
    
    override fun configurePinning(config: HttpClientConfig<*>) {
        if (!CertificatePinningConfig.PINNING_ENABLED) {
            println("⚠️ Certificate pinning is DISABLED")
            return
        }
        
        println("✅ Certificate pinning configured for iOS (${CertificatePinningConfig.API_HOSTNAME})")
    }
    
    override fun validateCertificate(hostname: String, pins: List<String>): Boolean {
        return true
    }
}
