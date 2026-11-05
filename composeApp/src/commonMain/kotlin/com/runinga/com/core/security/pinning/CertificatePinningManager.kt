package com.runinga.com.core.security.pinning

/**
 * Certificate Pinning Manager
 * 
 * Provides utilities for managing certificate pins, rotation, and monitoring.
 */
object CertificatePinningManager {
    
    /**
     * Validates that certificate pinning is properly configured
     */
    fun validateConfiguration(): ConfigurationStatus {
        val issues = mutableListOf<String>()
        
        // Check if pinning is enabled
        if (!CertificatePinningConfig.PINNING_ENABLED) {
            issues.add("⚠️ Certificate pinning is DISABLED")
        }
        
        // Check number of pins (should have at least 2 for redundancy)
        val pinCount = CertificatePinningConfig.CERTIFICATE_PINS.size
        when {
            pinCount == 0 -> issues.add("❌ No certificate pins configured")
            pinCount == 1 -> issues.add("⚠️ Only 1 pin configured - add backup pins for rotation safety")
            pinCount >= 2 -> issues.add("✅ $pinCount pins configured (good redundancy)")
        }
        
        // Check hostname format
        if (CertificatePinningConfig.API_HOSTNAME.isEmpty()) {
            issues.add("❌ API hostname is empty")
        } else if (CertificatePinningConfig.API_HOSTNAME.contains("localhost") || 
                   CertificatePinningConfig.API_HOSTNAME.contains("127.0.0.1")) {
            issues.add("⚠️ Hostname points to localhost - this is OK for development")
        } else {
            issues.add("✅ Hostname configured: ${CertificatePinningConfig.API_HOSTNAME}")
        }
        
        // Check pin format
        CertificatePinningConfig.CERTIFICATE_PINS.forEachIndexed { index, pin ->
            if (!pin.startsWith("sha256/")) {
                issues.add("❌ Pin $index has invalid format (must start with 'sha256/')")
            } else if (pin.length != 51) { // "sha256/" (7 chars) + base64 hash (44 chars)
                issues.add("⚠️ Pin $index may have invalid length (expected 51, got ${pin.length})")
            }
        }
        
        // Check user certificate policy
        if (CertificatePinningConfig.ALLOW_USER_CERTIFICATES) {
            issues.add("⚠️ User-installed certificates are ALLOWED - this reduces security in production")
        } else {
            issues.add("✅ User-installed certificates are blocked")
        }
        
        return ConfigurationStatus(
            isValid = !issues.any { it.startsWith("❌") },
            hasWarnings = issues.any { it.startsWith("⚠️") },
            messages = issues
        )
    }
    
    /**
     * Returns a human-readable report of the current configuration
     */
    fun getConfigurationReport(): String {
        val status = validateConfiguration()
        
        return buildString {
            appendLine("📋 Certificate Pinning Configuration Report")
            appendLine()
            appendLine("Hostname: ${CertificatePinningConfig.API_HOSTNAME}")
            appendLine("Pinning Enabled: ${CertificatePinningConfig.PINNING_ENABLED}")
            appendLine("Allow User Certs: ${CertificatePinningConfig.ALLOW_USER_CERTIFICATES}")
            appendLine("Pin Count: ${CertificatePinningConfig.CERTIFICATE_PINS.size}")
            appendLine()
            appendLine("Pins:")
            CertificatePinningConfig.CERTIFICATE_PINS.forEachIndexed { index, pin ->
                appendLine("  [$index] $pin")
            }
            appendLine()
            appendLine("Status:")
            status.messages.forEach { message ->
                appendLine("  $message")
            }
            appendLine()
            appendLine("Overall: ${when {
                !status.isValid -> "❌ INVALID - Fix errors before deploying"
                status.hasWarnings -> "⚠️ VALID with warnings - Review before production"
                else -> "✅ VALID - Ready for production"
            }}")
        }
    }
    
    /**
     * Checks if pins need rotation based on best practices
     * 
     * Note: This is a placeholder - actual cert expiry tracking requires
     * certificate validation data from the network layer
     */
    fun shouldRotatePins(): RotationRecommendation {
        val pinCount = CertificatePinningConfig.CERTIFICATE_PINS.size
        
        return when {
            pinCount == 0 -> RotationRecommendation(
                shouldRotate = true,
                urgency = RotationUrgency.CRITICAL,
                reason = "No pins configured"
            )
            pinCount == 1 -> RotationRecommendation(
                shouldRotate = true,
                urgency = RotationUrgency.HIGH,
                reason = "Only one pin configured - add backup pins before certificate rotation"
            )
            else -> RotationRecommendation(
                shouldRotate = false,
                urgency = RotationUrgency.NONE,
                reason = "Pin configuration looks good"
            )
        }
    }
}

/**
 * Configuration validation status
 */
data class ConfigurationStatus(
    val isValid: Boolean,
    val hasWarnings: Boolean,
    val messages: List<String>
)

/**
 * Pin rotation recommendation
 */
data class RotationRecommendation(
    val shouldRotate: Boolean,
    val urgency: RotationUrgency,
    val reason: String
)

enum class RotationUrgency {
    NONE,
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
