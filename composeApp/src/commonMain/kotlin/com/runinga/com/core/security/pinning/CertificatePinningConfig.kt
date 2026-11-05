package com.runinga.com.core.security.pinning

/**
 * Certificate Pinning Configuration
 * 
 * IMPORTANT: Update these pins before production deployment!
 * 
 * To get production certificate pins:
 *   cd backend
 *   node scripts/get-certificate-pins.js api.runinga.com
 * 
 * Current configuration is for OLD Railway setup (appu-app-production.up.railway.app)
 * You MUST update this when deploying to your new production server.
 */
object CertificatePinningConfig {
    
    /**
     * Production API hostname
     * Update this to match your production domain (e.g., "api.runinga.com")
     */
    const val API_HOSTNAME = "appu-app-production.up.railway.app"
    
    /**
     * Certificate pins (SHA-256 hashes of public keys)
     * 
     * Best practice: Pin at least 2 certificates
     * - Leaf certificate (your domain)
     * - Intermediate CA (backup for rotation)
     * - Root CA (optional, emergency backup)
     * 
     * Format: "sha256/BASE64_ENCODED_HASH"
     */
    val CERTIFICATE_PINS = listOf(
        "sha256/sGDbTDZa6e6YT2TE9XG0KNYPBuV/4YoqFrebzjQs1Ss=",  // Railway leaf certificate (OLD - UPDATE ME)
        "sha256/v7xVm0TVJNahMr2sZydE2jQH8SquXV9yLF9seROHHHU=",  // Let's Encrypt intermediate (OLD - UPDATE ME)
        "sha256/Q5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M="   // ISRG Root X1 (OLD - UPDATE ME)
    )
    
    /**
     * Enable/disable certificate pinning
     * 
     * Set to 'true' for production
     * Set to 'false' only in emergency situations (certificate mismatch)
     */
    const val PINNING_ENABLED = true
    
    /**
     * Allow user-installed certificates
     * 
     * Set to 'false' for production (more secure)
     * Set to 'true' only for development/debugging with proxy tools
     */
    const val ALLOW_USER_CERTIFICATES = false
    
    /**
     * Certificate expiry monitoring (manual tracking)
     * Update this date when you rotate certificates
     */
    const val CERTIFICATE_EXPIRY_NOTE = "Railway cert - expiry unknown, UPDATE for production"
}
