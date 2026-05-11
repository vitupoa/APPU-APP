package com.krieta.com.core.security

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock
import kotlinx.serialization.Serializable
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

/**
 * Data integrity checker using HMAC signatures
 * Protects against:
 * - Data tampering
 * - Cache poisoning
 * - Man-in-the-middle attacks
 * - Replay attacks
 */
@Serializable
data class SignedData(
    val data: String,
    val signature: String,
    val timestamp: Long,
    val version: Int = 1
)

class DataIntegrityChecker(
    private val secureConfig: SecureConfig
) {
    
    companion object {
        private const val MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000L // 7 days
    }
    
    /**
     * Signs data with HMAC for integrity verification
     */
    @OptIn(ExperimentalEncodingApi::class)
    suspend fun signData(data: String): SignedData = withContext(Dispatchers.IO) {
        val timestamp = Clock.System.now().toEpochMilliseconds()
        val payload = "$data|$timestamp"
        val signatureBytes = HmacSha256.sign(payload, secureConfig.HMAC_SECRET)
        val signature = Base64.encode(signatureBytes)
        
        SignedData(
            data = Base64.encode(data.toByteArray()),
            signature = signature,
            timestamp = timestamp
        )
    }
    
    /**
     * Verifies data signature and freshness
     * @throws SecurityException if signature invalid or data too old
     */
    @OptIn(ExperimentalEncodingApi::class)
    suspend fun verifyData(signedData: SignedData): String = withContext(Dispatchers.IO) {
        // Check age
        val age = Clock.System.now().toEpochMilliseconds() - signedData.timestamp
        if (age > MAX_AGE_MS) {
            println("⚠️ Data too old: ${age}ms")
            throw SecurityException("Data expired: cached data too old")
        }
        
        if (age < 0) {
            println("⚠️ Future timestamp detected: possible replay attack")
            throw SecurityException("Invalid timestamp: data from future")
        }
        
        // Decode data
        val decodedData = String(Base64.decode(signedData.data))
        
        // Verify signature
        val payload = "$decodedData|${signedData.timestamp}"
        val expectedSignatureBytes = HmacSha256.sign(payload, secureConfig.HMAC_SECRET)
        val expectedSignature = Base64.encode(expectedSignatureBytes)
        
        if (expectedSignature != signedData.signature) {
            println("⚠️ Signature mismatch: data may be tampered")
            throw SecurityException("Data integrity check failed: invalid signature")
        }
        
        decodedData
    }
    
    /**
     * Creates a checksum for data
     */
    suspend fun createChecksum(data: String): String = withContext(Dispatchers.IO) {
        val checksumBytes = HmacSha256.sign(data, secureConfig.HMAC_SECRET)
        Base64.encode(checksumBytes)
    }
    
    /**
     * Verifies data checksum
     */
    suspend fun verifyChecksum(data: String, checksum: String): Boolean = withContext(Dispatchers.IO) {
        val computedBytes = HmacSha256.sign(data, secureConfig.HMAC_SECRET)
        val computed = Base64.encode(computedBytes)
        computed == checksum
    }
}

/**
 * Secure wrapper for cached data with integrity checks
 */
@Serializable
data class SecureCachedData<T>(
    val payload: String, // Encrypted data
    val signature: String, // HMAC signature
    val timestamp: Long,
    val checksum: String, // Additional integrity check
    val version: Int = 1
)

class SecureDataWrapper(
    private val encryption: DatabaseEncryption,
    private val integrity: DataIntegrityChecker
) {
    
    /**
     * Wraps data with encryption and integrity checks
     */
    suspend fun <T> wrapData(data: T, serializer: (T) -> String): SecureCachedData<T> {
        // Serialize
        val json = serializer(data)
        
        // Encrypt
        val encrypted = encryption.encrypt(json)
        
        // Sign
        val timestamp = Clock.System.now().toEpochMilliseconds()
        val signature = integrity.createChecksum("$encrypted|$timestamp")
        
        // Create checksum
        val checksum = integrity.createChecksum(json)
        
        return SecureCachedData(
            payload = encrypted,
            signature = signature,
            timestamp = timestamp,
            checksum = checksum
        )
    }
    
    /**
     * Unwraps and verifies data
     * @throws SecurityException if verification fails
     */
    suspend fun <T> unwrapData(
        secureData: SecureCachedData<T>,
        deserializer: (String) -> T
    ): T {
        // Verify age
        val age = Clock.System.now().toEpochMilliseconds() - secureData.timestamp
        if (age > 7 * 24 * 60 * 60 * 1000L) { // 7 days
            throw SecurityException("Cached data expired")
        }
        
        // Verify signature
        val expectedSignature = integrity.createChecksum("${secureData.payload}|${secureData.timestamp}")
        if (expectedSignature != secureData.signature) {
            println("⚠️ Signature verification failed")
            throw SecurityException("Data integrity check failed")
        }
        
        // Decrypt
        val decrypted = encryption.decrypt(secureData.payload)
        
        // Verify checksum
        val computedChecksum = integrity.createChecksum(decrypted)
        if (computedChecksum != secureData.checksum) {
            println("⚠️ Checksum verification failed")
            throw SecurityException("Data checksum mismatch")
        }
        
        // Deserialize
        return deserializer(decrypted)
    }
}
