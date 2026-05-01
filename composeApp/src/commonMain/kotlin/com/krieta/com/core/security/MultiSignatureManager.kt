package com.krieta.com.core.security

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlin.time.Duration.Companion.minutes

/**
 * Multi-signature manager for high-value transactions
 * Requires multiple approvals for transactions above threshold
 */
class MultiSignatureManager {
    
    private val mutex = Mutex()
    private val pendingTransactions = mutableMapOf<String, PendingTransaction>()
    
    data class MultiSigConfig(
        val highValueThresholdKr: Double = 100000.0, // 100,000 Kr
        val criticalValueThresholdKr: Double = 500000.0, // 500,000 Kr
        val requiredSignaturesHigh: Int = 2, // 2 signatures for high value
        val requiredSignaturesCritical: Int = 3, // 3 signatures for critical value
        val signatureExpiryMinutes: Int = 30 // Signatures expire after 30 minutes
    )
    
    data class PendingTransaction(
        val transactionId: String,
        val userId: String,
        val amountKr: Double,
        val provider: String,
        val accountDetails: Map<String, Any>,
        val createdAt: Instant,
        val signatures: MutableList<TransactionSignature> = mutableListOf(),
        val requiredSignatures: Int
    )
    
    data class TransactionSignature(
        val signerId: String,
        val signerName: String,
        val signature: ByteArray,
        val timestamp: Instant,
        val deviceId: String
    ) {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other == null || this::class != other::class) return false
            other as TransactionSignature
            return signerId == other.signerId
        }
        
        override fun hashCode(): Int = signerId.hashCode()
    }
    
    sealed class MultiSigResult {
        data class RequiresApproval(
            val transactionId: String,
            val requiredSignatures: Int,
            val currentSignatures: Int
        ) : MultiSigResult()
        
        data class Approved(val transactionId: String) : MultiSigResult()
        object NotRequired : MultiSigResult()
        data class Error(val message: String) : MultiSigResult()
    }
    
    private val config = MultiSigConfig()
    
    /**
     * Check if transaction requires multi-signature approval
     */
    fun requiresMultiSignature(amountKr: Double): Boolean {
        return amountKr >= config.highValueThresholdKr
    }
    
    /**
     * Get required number of signatures for amount
     */
    fun getRequiredSignatures(amountKr: Double): Int {
        return when {
            amountKr >= config.criticalValueThresholdKr -> config.requiredSignaturesCritical
            amountKr >= config.highValueThresholdKr -> config.requiredSignaturesHigh
            else -> 1
        }
    }
    
    /**
     * Create a pending transaction requiring multi-signature
     */
    suspend fun createPendingTransaction(
        transactionId: String,
        userId: String,
        amountKr: Double,
        provider: String,
        accountDetails: Map<String, Any>
    ): MultiSigResult = mutex.withLock {
        
        if (!requiresMultiSignature(amountKr)) {
            return@withLock MultiSigResult.NotRequired
        }
        
        val requiredSigs = getRequiredSignatures(amountKr)
        
        val pending = PendingTransaction(
            transactionId = transactionId,
            userId = userId,
            amountKr = amountKr,
            provider = provider,
            accountDetails = accountDetails,
            createdAt = Clock.System.now(),
            requiredSignatures = requiredSigs
        )
        
        pendingTransactions[transactionId] = pending
        
        MultiSigResult.RequiresApproval(
            transactionId = transactionId,
            requiredSignatures = requiredSigs,
            currentSignatures = 0
        )
    }
    
    /**
     * Add a signature to pending transaction
     */
    suspend fun addSignature(
        transactionId: String,
        signerId: String,
        signerName: String,
        signature: ByteArray,
        deviceId: String
    ): MultiSigResult = mutex.withLock {
        
        val pending = pendingTransactions[transactionId]
            ?: return@withLock MultiSigResult.Error("Transaction not found")
        
        // Check if transaction expired
        val now = Clock.System.now()
        val age = now - pending.createdAt
        if (age.inWholeMinutes > config.signatureExpiryMinutes) {
            pendingTransactions.remove(transactionId)
            return@withLock MultiSigResult.Error("Transaction expired. Please create a new withdrawal request.")
        }
        
        // Check if signer already signed
        if (pending.signatures.any { it.signerId == signerId }) {
            return@withLock MultiSigResult.Error("You have already signed this transaction")
        }
        
        // Add signature
        pending.signatures.add(
            TransactionSignature(
                signerId = signerId,
                signerName = signerName,
                signature = signature,
                timestamp = now,
                deviceId = deviceId
            )
        )
        
        // Check if we have enough signatures
        if (pending.signatures.size >= pending.requiredSignatures) {
            pendingTransactions.remove(transactionId)
            return@withLock MultiSigResult.Approved(transactionId)
        }
        
        MultiSigResult.RequiresApproval(
            transactionId = transactionId,
            requiredSignatures = pending.requiredSignatures,
            currentSignatures = pending.signatures.size
        )
    }
    
    /**
     * Get pending transaction details
     */
    suspend fun getPendingTransaction(transactionId: String): PendingTransaction? = mutex.withLock {
        pendingTransactions[transactionId]
    }
    
    /**
     * Get all pending transactions for user
     */
    suspend fun getUserPendingTransactions(userId: String): List<PendingTransaction> = mutex.withLock {
        pendingTransactions.values.filter { it.userId == userId }
    }
    
    /**
     * Cancel pending transaction
     */
    suspend fun cancelTransaction(transactionId: String, userId: String): Boolean = mutex.withLock {
        val pending = pendingTransactions[transactionId]
        if (pending?.userId == userId) {
            pendingTransactions.remove(transactionId)
            true
        } else {
            false
        }
    }
    
    /**
     * Clean up expired transactions
     */
    suspend fun cleanupExpired() = mutex.withLock {
        val now = Clock.System.now()
        val expired = pendingTransactions.filter { (_, tx) ->
            (now - tx.createdAt).inWholeMinutes > config.signatureExpiryMinutes
        }
        expired.keys.forEach { pendingTransactions.remove(it) }
    }
    
    /**
     * Get multi-signature statistics
     */
    suspend fun getStats(): MultiSigStats = mutex.withLock {
        MultiSigStats(
            pendingCount = pendingTransactions.size,
            highValueThresholdKr = config.highValueThresholdKr,
            criticalValueThresholdKr = config.criticalValueThresholdKr
        )
    }
    
    data class MultiSigStats(
        val pendingCount: Int,
        val highValueThresholdKr: Double,
        val criticalValueThresholdKr: Double
    )
}
