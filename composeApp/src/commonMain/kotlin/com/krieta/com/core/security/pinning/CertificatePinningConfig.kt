package com.krieta.com.core.security.pinning

object CertificatePinningConfig {
    
    const val API_HOSTNAME = "appu-app-production.up.railway.app"
    
    val CERTIFICATE_PINS = listOf(
        "sha256/fVKtHrsVRCGmQpBjRIRg82XoQd8FKwvreLe/YM3RLVY="  // ISRG Root X1 (Let's Encrypt root, valid until 2035)
    )
    
    val PINNING_ENABLED = true
    
    const val ALLOW_USER_CERTIFICATES = false
}
