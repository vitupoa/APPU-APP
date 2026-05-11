package com.krieta.com.core.security

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

/**
 * Security manager that initializes and coordinates all security components
 */
class SecurityManager(
    private val databaseEncryption: DatabaseEncryption,
    private val integrityChecker: DataIntegrityChecker,
    private val secureKeyStorage: SecureKeyStorage,
    private val scope: CoroutineScope
) {
    
    private var isInitialized = false
    
    fun initialize() {
        if (isInitialized) return
        
        scope.launch {
            try {
                // Initialize encryption
                databaseEncryption.initialize()
                
                // Verify key storage
                verifyKeyStorage()
                
                isInitialized = true
                println("✅ Security manager initialized")
            } catch (e: Exception) {
                println("❌ Security initialization failed: ${e.message}")
                throw SecurityException("Failed to initialize security", e)
            }
        }
    }
    
    private suspend fun verifyKeyStorage() {
        // Test key storage
        val testKey = "test_key"
        val testData = "test_data".toByteArray()
        
        secureKeyStorage.storeKey(testKey, testData)
        val retrieved = secureKeyStorage.retrieveKey(testKey)
        
        if (retrieved == null || !retrieved.contentEquals(testData)) {
            throw SecurityException("Key storage verification failed")
        }
        
        secureKeyStorage.deleteKey(testKey)
    }
    
    suspend fun wipeAllSecurityData() {
        databaseEncryption.wipeEncryptionKey()
        // Additional cleanup if needed
        isInitialized = false
    }
}

/**
 * Security configuration
 */
object SecurityConfig {
    // Database encryption
    const val ENABLE_DB_ENCRYPTION = true
    const val ENABLE_INTEGRITY_CHECKS = true
    
    // Input validation
    const val ENABLE_INPUT_VALIDATION = true
    const val MAX_INPUT_LENGTH = 10000
    
    // Rate limiting
    const val ENABLE_RATE_LIMITING = true
    const val MAX_REQUESTS_PER_MINUTE = 60
    
    // Cache security
    const val MAX_CACHE_AGE_DAYS = 7
    const val ENABLE_CACHE_ENCRYPTION = true
    
    // Network security
    const val ENABLE_CERTIFICATE_PINNING = true
    const val ENABLE_TLS_VERIFICATION = true
    
    // Logging
    const val LOG_SECURITY_EVENTS = true
    const val LOG_VALIDATION_FAILURES = true
}

/**
 * Security event logger
 */
object SecurityLogger {
    
    private val events = mutableListOf<SecurityEvent>()
    
    data class SecurityEvent(
        val type: EventType,
        val message: String,
        val timestamp: Long = System.currentTimeMillis()
    )
    
    enum class EventType {
        SQL_INJECTION_ATTEMPT,
        XSS_ATTEMPT,
        PATH_TRAVERSAL_ATTEMPT,
        INVALID_INPUT,
        ENCRYPTION_FAILURE,
        INTEGRITY_FAILURE,
        RATE_LIMIT_EXCEEDED,
        SUSPICIOUS_ACTIVITY
    }
    
    fun logEvent(type: EventType, message: String) {
        if (!SecurityConfig.LOG_SECURITY_EVENTS) return
        
        val event = SecurityEvent(type, message)
        events.add(event)
        
        // Keep only last 1000 events
        if (events.size > 1000) {
            events.removeAt(0)
        }
        
        println("🔒 Security Event [${type.name}]: $message")
    }
    
    fun getRecentEvents(count: Int = 100): List<SecurityEvent> {
        return events.takeLast(count)
    }
    
    fun clearEvents() {
        events.clear()
    }
}
