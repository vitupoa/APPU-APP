package com.krieta.com.security

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import okhttp3.CertificatePinner
import java.util.concurrent.TimeUnit

object CertificatePinningConfig {
    
    /**
     * Configure certificate pinning for production
     * 
     * IMPORTANT: Replace these pins with your actual server's certificate pins
     * 
     * To get your certificate pins:
     * 1. Run: openssl s_client -connect your-domain.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
     * 2. Add the output as a pin below
     */
    fun createSecureHttpClient(): HttpClient {
        return HttpClient(OkHttp) {
            engine {
                config {
                    // Certificate pinning
                    certificatePinner(
                        CertificatePinner.Builder()
                            // Replace with your actual domain and certificate pins
                            // Example: .add("api.krieta.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
                            // .add("api.krieta.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=") // Backup pin
                            .build()
                    )
                    
                    // Timeouts
                    connectTimeout(30, TimeUnit.SECONDS)
                    readTimeout(30, TimeUnit.SECONDS)
                    writeTimeout(30, TimeUnit.SECONDS)
                    
                    // Disable insecure protocols
                    followRedirects(false)
                    followSslRedirects(false)
                }
            }
        }
    }
}
