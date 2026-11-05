package com.runinga.com.core.security

/**
 * Hardware-backed secure key storage interface
 * Uses Android Keystore and iOS Secure Enclave
 */
interface SecureKeyStorage {
    /**
     * Check if hardware-backed security is available
     */
    fun isHardwareBackedSecurityAvailable(): Boolean
    
    /**
     * Generate a new key pair in secure hardware
     * @param alias Key identifier
     * @param requireBiometric Require biometric authentication for key usage
     * @return true if successful
     */
    suspend fun generateKeyPair(alias: String, requireBiometric: Boolean = true): Boolean
    
    /**
     * Sign data using hardware-backed private key
     * @param alias Key identifier
     * @param data Data to sign
     * @return Signature bytes or null if failed
     */
    suspend fun signData(alias: String, data: ByteArray): ByteArray?
    
    /**
     * Encrypt data using hardware-backed key
     * @param alias Key identifier
     * @param data Data to encrypt
     * @return Encrypted bytes or null if failed
     */
    suspend fun encryptData(alias: String, data: ByteArray): ByteArray?
    
    /**
     * Decrypt data using hardware-backed key
     * @param alias Key identifier
     * @param encryptedData Encrypted data
     * @return Decrypted bytes or null if failed
     */
    suspend fun decryptData(alias: String, encryptedData: ByteArray): ByteArray?
    
    /**
     * Store a symmetric key securely
     * @param alias Key identifier
     * @param keyData Key bytes to store
     */
    suspend fun storeKey(alias: String, keyData: ByteArray)
    
    /**
     * Retrieve a symmetric key
     * @param alias Key identifier
     * @return Key bytes or null if not found
     */
    suspend fun retrieveKey(alias: String): ByteArray?
    
    /**
     * Delete key from secure storage
     * @param alias Key identifier
     */
    fun deleteKey(alias: String)
    
    /**
     * Check if key exists
     * @param alias Key identifier
     */
    fun keyExists(alias: String): Boolean
}
