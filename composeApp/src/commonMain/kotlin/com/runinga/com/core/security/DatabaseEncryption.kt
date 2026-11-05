package com.runinga.com.core.security

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

/**
 * Database encryption manager for securing local SQLite data
 * Protects against:
 * - Data theft from device
 * - Unauthorized access to cached data
 * - Man-in-the-middle attacks on local storage
 */
class DatabaseEncryption(private val secureKeyStorage: SecureKeyStorage) {
    
    companion object {
        private const val ALGORITHM = "AES/GCM/NoPadding"
        private const val KEY_SIZE = 256
        private const val GCM_TAG_LENGTH = 128
        private const val DB_ENCRYPTION_KEY_ALIAS = "runinga_db_encryption_key"
    }
    
    private var encryptionKey: SecretKey? = null
    
    suspend fun initialize() = withContext(Dispatchers.IO) {
        encryptionKey = getOrCreateEncryptionKey()
    }
    
    private suspend fun getOrCreateEncryptionKey(): SecretKey {
        // Try to retrieve existing key from hardware-backed storage
        val existingKeyData = secureKeyStorage.retrieveKey(DB_ENCRYPTION_KEY_ALIAS)
        if (existingKeyData != null && existingKeyData.size == KEY_SIZE / 8) {
            return SecretKeySpec(existingKeyData, "AES")
        }
        
        // Generate new cryptographically secure key
        val keyGenerator = KeyGenerator.getInstance("AES")
        keyGenerator.init(KEY_SIZE, java.security.SecureRandom())
        val newKey = keyGenerator.generateKey()
        
        // Store in hardware-backed keystore (Android Keystore/iOS Secure Enclave)
        secureKeyStorage.storeKey(DB_ENCRYPTION_KEY_ALIAS, newKey.encoded)
        
        return newKey
    }
    
    @OptIn(ExperimentalEncodingApi::class)
    suspend fun encrypt(plaintext: String): String = withContext(Dispatchers.IO) {
        try {
            val key = encryptionKey ?: throw IllegalStateException("Encryption not initialized")
            
            val cipher = Cipher.getInstance(ALGORITHM)
            cipher.init(Cipher.ENCRYPT_MODE, key)
            
            val iv = cipher.iv
            val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
            
            // Combine IV + ciphertext
            val combined = iv + ciphertext
            Base64.encode(combined)
        } catch (e: Exception) {
            println("❌ Encryption failed: ${e.message}")
            throw SecurityException("Failed to encrypt data", e)
        }
    }
    
    @OptIn(ExperimentalEncodingApi::class)
    suspend fun decrypt(encrypted: String): String = withContext(Dispatchers.IO) {
        try {
            val key = encryptionKey ?: throw IllegalStateException("Encryption not initialized")
            
            val combined = Base64.decode(encrypted)
            
            // Extract IV (first 12 bytes for GCM)
            val iv = combined.copyOfRange(0, 12)
            val ciphertext = combined.copyOfRange(12, combined.size)
            
            val cipher = Cipher.getInstance(ALGORITHM)
            val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, key, spec)
            
            val plaintext = cipher.doFinal(ciphertext)
            String(plaintext, Charsets.UTF_8)
        } catch (e: Exception) {
            println("❌ Decryption failed: ${e.message}")
            throw SecurityException("Failed to decrypt data", e)
        }
    }
    
    suspend fun wipeEncryptionKey() = withContext(Dispatchers.IO) {
        secureKeyStorage.deleteKey(DB_ENCRYPTION_KEY_ALIAS)
        encryptionKey = null
    }
}
