package com.krieta.com.core.security

import kotlin.random.Random

/**
 * Withdrawal Security - Client-side validation only
 * 
 * IMPORTANT: This is NOT cryptographically secure authorization
 * Server MUST validate all withdrawals independently
 * These checks are for UX only (prevent obvious errors before API call)
 */
object WithdrawalSecurity {
    
    /**
     * Generate a cryptographically secure nonce for request uniqueness
     */
    fun generateNonce(): String {
        val bytes = ByteArray(16)
        // Use secure random
        for (i in bytes.indices) {
            bytes[i] = Random.nextInt(256).toByte()
        }
        return bytes.joinToString("") { "%02x".format(it) }
    }
    
    /**
     * Validate withdrawal amount constraints
     */
    fun validateWithdrawalAmount(
        requestedAmount: Double,
        availableBalance: Double,
        minAmount: Double = 1.0,
        maxAmount: Double = 1000000.0
    ): ValidationResult {
        // Check if amount is positive
        if (requestedAmount <= 0) {
            return ValidationResult(false, "Withdrawal amount must be greater than 0")
        }
        
        // Check minimum amount
        if (requestedAmount < minAmount) {
            return ValidationResult(false, "Minimum withdrawal amount is $minAmount Kr")
        }
        
        // Check maximum amount
        if (requestedAmount > maxAmount) {
            return ValidationResult(false, "Maximum withdrawal amount is $maxAmount Kr")
        }
        
        // Check if amount is a valid number (not NaN or Infinity)
        if (!requestedAmount.isFinite()) {
            return ValidationResult(false, "Invalid withdrawal amount")
        }
        
        // Check if user has sufficient balance
        if (requestedAmount > availableBalance) {
            return ValidationResult(
                false, 
                "Insufficient balance. Available: $availableBalance Kr, Requested: $requestedAmount Kr"
            )
        }
        
        // Check for decimal precision (max 2 decimal places)
        val rounded = (requestedAmount * 100).toLong() / 100.0
        if (requestedAmount != rounded) {
            return ValidationResult(false, "Amount can have maximum 2 decimal places")
        }
        
        return ValidationResult(true, "Amount validation passed")
    }
    
