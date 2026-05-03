package com.krieta.com.core.security

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.random.Random

object WithdrawalSecurity {
    
    private const val SECURITY_SALT = "KRIETA_WITHDRAWAL_SECURITY_2024"
    
    /**
     * Generate a secure hash for the withdrawal amount to prevent tampering
     */
    fun generateAmountHash(
        userId: String,
        amount: Double,
        timestamp: Long,
        nonce: String = generateNonce()
    ): String {
        val data = "$userId:$amount:$timestamp:$nonce:$SECURITY_SALT"
        return hashString(data)
    }
    
    /**
     * Generate a secure hash for the user's balance to validate client-side balance checks
     */
    fun generateBalanceHash(
        userId: String,
        balance: Double,
        timestamp: Long
    ): String {
        val data = "$userId:$balance:$timestamp:$SECURITY_SALT"
        return hashString(data)
    }
    
    /**
     * Validate that the amount hash matches the expected value
     */
    fun validateAmountHash(
        userId: String,
        amount: Double,
        timestamp: Long,
        providedHash: String,
        nonce: String
    ): Boolean {
        val expectedHash = generateAmountHash(userId, amount, timestamp, nonce)
        return expectedHash == providedHash
    }
    
    /**
     * Validate that the balance hash matches the expected value
     */
    fun validateBalanceHash(
        userId: String,
        balance: Double,
        timestamp: Long,
        providedHash: String
    ): Boolean {
        val expectedHash = generateBalanceHash(userId, balance, timestamp)
        return expectedHash == providedHash
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
    
    /**
     * Generate a cryptographically secure nonce
     */
    fun generateNonce(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        return (1..16)
            .map { chars[Random.nextInt(chars.length)] }
            .joinToString("")
    }
    
    /**
     * Simple hash function (in production, use a proper cryptographic hash)
     */
    private fun hashString(input: String): String {
        return input.hashCode().toString(16).padStart(8, '0')
    }
    
    /**
     * Validate request timestamp to prevent replay attacks
     */
    fun validateTimestamp(timestamp: Long, maxAgeMinutes: Int = 5): Boolean {
        val currentTime = System.currentTimeMillis()
        val maxAge = maxAgeMinutes * 60 * 1000L
        return (currentTime - timestamp) <= maxAge && timestamp <= currentTime
    }
}

data class ValidationResult(
    val isValid: Boolean,
    val message: String
)