package com.runinga.com.core.security

import kotlinx.cinterop.*
import platform.CoreFoundation.*
import platform.Foundation.*
import platform.Security.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString

class IosTokenManager : TokenManager {
    
    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun saveAccessToken(token: String) {
        saveToKeychain(KEY_ACCESS_TOKEN, token)
    }

    override suspend fun getAccessToken(): String? {
        return getFromKeychain(KEY_ACCESS_TOKEN)
    }

    override suspend fun saveRefreshToken(token: String) {
        saveToKeychain(KEY_REFRESH_TOKEN, token)
    }

    override suspend fun getRefreshToken(): String? {
        return getFromKeychain(KEY_REFRESH_TOKEN)
    }

    override suspend fun clearTokens() {
        deleteFromKeychain(KEY_ACCESS_TOKEN)
        deleteFromKeychain(KEY_REFRESH_TOKEN)
        deleteFromKeychain(KEY_USER_SESSION)
    }

    override suspend fun isLoggedIn(): Boolean {
        return getAccessToken() != null
    }
    
    override suspend fun saveUserSession(session: UserSession) {
        val sessionJson = json.encodeToString(session)
        saveToKeychain(KEY_USER_SESSION, sessionJson)
    }
    
    override suspend fun getUserSession(): UserSession? {
        val sessionJson = getFromKeychain(KEY_USER_SESSION) ?: return null
        return try {
            json.decodeFromString<UserSession>(sessionJson)
        } catch (e: Exception) {
            null
        }
    }
    
    override suspend fun getUserId(): String? {
        return getUserSession()?.userId ?: run {
            val token = getAccessToken() ?: return null
            JwtDecoder.getUserId(token)
        }
    }

    @OptIn(ExperimentalForeignApi::class)
    private fun saveToKeychain(key: String, value: String) {
        // Delete existing item first
        deleteFromKeychain(key)
        
        // Prepare data
        val valueData = value.encodeToByteArray()
        val data = valueData.usePinned { pinned ->
            NSData.create(
                bytes = pinned.addressOf(0),
                length = valueData.size.toULong()
            )
        }
        
        // Create query dictionary
        val query = CFDictionaryCreateMutable(
            null,
            4,
            null,
            null
        )
        
        CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword)
        CFDictionarySetValue(query, kSecAttrAccount, CFBridgingRetain(key as NSString))
        CFDictionarySetValue(query, kSecValueData, CFBridgingRetain(data))
        CFDictionarySetValue(query, kSecAttrAccessible, kSecAttrAccessibleAfterFirstUnlock)
        
        // Add to keychain
        val status = SecItemAdd(query, null)
        
        CFRelease(query)
        
        if (status != errSecSuccess) {
            println("Keychain save error: $status")
        }
    }

    @OptIn(ExperimentalForeignApi::class)
    private fun getFromKeychain(key: String): String? {
        memScoped {
            val query = CFDictionaryCreateMutable(
                null,
                5,
                null,
                null
            )
            
            CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword)
            CFDictionarySetValue(query, kSecAttrAccount, CFBridgingRetain(key as NSString))
            CFDictionarySetValue(query, kSecReturnData, kCFBooleanTrue)
            CFDictionarySetValue(query, kSecMatchLimit, kSecMatchLimitOne)
            
            val result = alloc<CFTypeRefVar>()
            val status = SecItemCopyMatching(query, result.ptr)
            
            CFRelease(query)
            
            if (status == errSecSuccess) {
                val data = CFBridgingRelease(result.value) as? NSData
                return data?.let {
                    val bytes = ByteArray(it.length.toInt())
                    if (bytes.isNotEmpty()) {
                        bytes.usePinned { pinned ->
                            platform.posix.memcpy(pinned.addressOf(0), it.bytes, it.length)
                        }
                    }
                    bytes.decodeToString()
                }
            }
            
            return null
        }
    }

    @OptIn(ExperimentalForeignApi::class)
    private fun deleteFromKeychain(key: String) {
        val query = CFDictionaryCreateMutable(
            null,
            2,
            null,
            null
        )
        
        CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword)
        CFDictionarySetValue(query, kSecAttrAccount, CFBridgingRetain(key as NSString))
        
        SecItemDelete(query)
        CFRelease(query)
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "runinga_access_token"
        private const val KEY_REFRESH_TOKEN = "runinga_refresh_token"
        private const val KEY_USER_SESSION = "runinga_user_session"
    }
}
