package com.krieta.com.core.security

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

/**
 * Financial Transaction Security Manager
 * 
 * CRITICAL SECURITY RULES:
 * 1. NO hardcoded secrets - all keys come from server
 * 2. NO offline queueing of financial transactions
 * 3. Server validates ALL transactions
 * 4. Client signatures are anti-tampering only, NOT authorization
 */
class FinancialTransactionSecurity {
    
    private val mutex = Mutex()
    private var sessionSecret: ByteArray? = null
    private var secretExpiresAt: Long = 0
    
    /**
     * Initialize with server-provided session secret
     * Server rotates this secret periodically for security
     * 
     * @param secret Base64-encoded secret from server
     * @param expiresAt Unix timestamp when secret expires
     */
    @OptIn(ExperimentalEncodingApi::class)
    suspend fun initializeSessionSecret(secret: String, expiresAt: Long) = mutex.withLock {
        require(secret.isNotEmpty()) { "Session secret cannot be empty" }
        require(expiresAt > System.currentTimeMillis()) { "Secret already expired" }
        
        sessionSecret = Base64.decode(secret)
        secretExpiresAt = expiresAt
        
        println("✅ Financial session secret initialized (expires: $expiresAt)")
    }
    
    /**
     * Check if session secret is valid and not expired
     */
    suspend fun isSessionValid(): Boolean = mutex.withLock {
        sessionSecret != null && System.currentTimeMillis() < secretExpiresAt
    }
    
    /**
     * Clear session secret (on logout or expiry)
     */
    suspend fun clearSession() = mutex.withLock {
        sessionSecret?.fill(0) // Zero out memory
        sessionSecret = null
        secretExpiresAt = 0
    }
    
    /**
     * Sign a withdrawal request
     * 
     * @param userId User ID
     * @param krAmount Amount in Kr
     * @param provider Payment provider
     * @param currency Target currency
     * @param nonce Unique request ID from server
     * @param timestamp Request timestamp
     * @return Signature or null if session invalid
     */
    suspend fun signWithdrawal(
        userId: String,
        krAmount: Double,
        provider: String,
        currency: String,
        nonce: String,
        timestamp: Long
    ): String? = mutex.withLock {
        if (!isSessionValid()) {
            println("❌ Cannot sign withdrawal: session invalid or expired")
            return null
        }
        
        val canonical = "WITHDRAW|userId=$userId&krAmount=$krAmount&provider=$provider&currency=$currency&nonce=$nonce&timestamp=$timestamp"
        return sessionSecret?.let { SecureHmac.sign(canonical, it) }
    }
    
    /**
     * Sign a tip request
     * 
     * @param senderId Sender user ID
     * @param recipientId Recipient user ID
     * @param krAmount Amount in Kr
     * @param nonce Unique request ID from server
     * @param timestamp Request timestamp
     * @return Signature or null if session invalid
     */
    suspend fun signTip(
        senderId: String,
        recipientId: String,
        krAmount: Int,
        nonce: String,
        timestamp: Long
    ): String? = mutex.withLock {
        if (!isSessionValid()) {
            println("❌ Cannot sign tip: session invalid or expired")
            return null
        }
        
        val canonical = "TIP|senderId=$senderId&recipientId=$recipientId&krAmount=$krAmount&nonce=$nonce&timestamp=$timestamp"
        return sessionSecret?.let { SecureHmac.sign(canonical, it) }
    }
    
    /**
     * Sign a top-up request
     * 
     * @param userId User ID
     * @param amount Amount in local currency
     * @param currency Currency code
     * @param paymentMethod Payment method
     * @param nonce Unique request ID from server
     * @param timestamp Request timestamp
     * @return Signature or null if session invalid
     */
    suspend fun signTopUp(
        userId: String,
        amount: Double,
        currency: String,
        paymentMethod: String,
        nonce: String,
        timestamp: Long
    ): String? = mutex.withLock {
        if (!isSessionValid()) {
            println("❌ Cannot sign top-up: session invalid or expired")
            return null
        }
        
        val canonical = "TOPUP|userId=$userId&amount=$amount&currency=$currency&paymentMethod=$paymentMethod&nonce=$nonce&timestamp=$timestamp"
        return sessionSecret?.let { SecureHmac.sign(canonical, it) }
    }
    
    /**
     * Validate transaction amount constraints
     */
    fun validateAmount(
        amount: Double,
        minAmount: Double,
        maxAmount: Double
    ): ValidationResult {
        if (amount <= 0) {
            return ValidationResult(false, "Amount must be greater than 0")
        }
        
        if (!amount.isFinite()) {
            return ValidationResult(false, "Invalid amount")
        }
        
        if (amount < minAmount) {
            return ValidationResult(false, "Minimum amount is $minAmount")
        }
        
        if (amount > maxAmount) {
            return ValidationResult(false, "Maximum amount is $maxAmount")
        }
        
        // Check decimal precision (max 2 decimal places)
        val rounded = (amount * 100).toLong() / 100.0
        if (amount != rounded) {
            return ValidationResult(false, "Amount can have maximum 2 decimal places")
        }
        
        return ValidationResult(true, "Valid")
    }
}

data class ValidationResult(
    val isValid: Boolean,
    val message: String
)
