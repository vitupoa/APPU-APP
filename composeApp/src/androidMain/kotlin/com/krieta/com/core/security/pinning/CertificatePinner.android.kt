package com.krieta.com.core.security.pinning

import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.okhttp.OkHttpConfig
import okhttp3.CertificatePinner as OkHttpCertificatePinner
import java.security.cert.X509Certificate
import javax.net.ssl.X509TrustManager

actual fun createCertificatePinner(): CertificatePinner = AndroidCertificatePinner()

class AndroidCertificatePinner : CertificatePinner {
    
    override fun configurePinning(config: HttpClientConfig<*>) {
        if (!CertificatePinningConfig.PINNING_ENABLED) {
            println("⚠️ Certificate pinning is DISABLED")
            return
        }
        
        config.apply {
            engine {
                if (this is OkHttpConfig) {
                    val pinnerBuilder = OkHttpCertificatePinner.Builder()
                    
                    CertificatePinningConfig.CERTIFICATE_PINS.forEach { pin ->
                        pinnerBuilder.add(CertificatePinningConfig.API_HOSTNAME, pin)
                    }
                    
                    val certificatePinner = pinnerBuilder.build()
                    
                    config {
                        certificatePinner(certificatePinner)
                    }
                    
                    println("✅ Certificate pinning configured for ${CertificatePinningConfig.API_HOSTNAME}")
                }
            }
        }
    }
    
    override fun validateCertificate(hostname: String, pins: List<String>): Boolean {
        return true
    }
}
