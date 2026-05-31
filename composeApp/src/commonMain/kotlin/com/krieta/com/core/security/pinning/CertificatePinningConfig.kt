package com.krieta.com.core.security.pinning

object CertificatePinningConfig {
    
    const val API_HOSTNAME = "appu-app-production.up.railway.app"
    
    val CERTIFICATE_PINS = listOf(
        "sha256/1UF7u2rF/gMt/exg0vytwI7Y1lh6itDPCKovyHH8Dk0="  // Railway SSL certificate
    )
    
    val PINNING_ENABLED = false  // Disabled: re-enable with correct pin after certificate stabilizes
    
    const val ALLOW_USER_CERTIFICATES = false
}
