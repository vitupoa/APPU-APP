package com.krieta.com.core.security.pinning

object CertificatePinningConfig {
    
    const val API_HOSTNAME = "appu-app-production.up.railway.app"
    
    val CERTIFICATE_PINS = listOf(
        "sha256/sGDbTDZa6e6YT2TE9XG0KNYPBuV/4YoqFrebzjQs1Ss=",  // Railway leaf certificate
        "sha256/v7xVm0TVJNahMr2sZydE2jQH8SquXV9yLF9seROHHHU=",  // Let's Encrypt intermediate
        "sha256/Q5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M="   // ISRG Root X1
    )
    
    val PINNING_ENABLED = true  // Enabled with Railway certificate chain
    
    const val ALLOW_USER_CERTIFICATES = false
}
