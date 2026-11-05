package com.runinga.com.core.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

actual object SecureConfig {
    actual val TRANSACTION_SIGNING_SECRET: String = AppConfig.TRANSACTION_SIGNING_SECRET
    
    // HMAC secret should be stored in EncryptedSharedPreferences
    // Generate once and store securely, never hardcode
    actual val HMAC_SECRET: String
        get() = getOrGenerateHmacSecret()
    
    private var cachedSecret: String? = null
    private lateinit var context: Context
    
    fun initialize(appContext: Context) {
        context = appContext.applicationContext
    }
    
    private fun getOrGenerateHmacSecret(): String {
        if (cachedSecret != null) return cachedSecret!!
        
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        
        val sharedPreferences = EncryptedSharedPreferences.create(
            context,
            "runinga_secure_config",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        
        var secret = sharedPreferences.getString("hmac_secret", null)
        if (secret == null) {
            secret = generateSecret()
            sharedPreferences.edit().putString("hmac_secret", secret).apply()
        }
        
        cachedSecret = secret
        return secret
    }
    
    private fun generateSecret(): String {
        return java.util.UUID.randomUUID().toString() + java.util.UUID.randomUUID().toString()
    }
    
    actual fun rotateHmacSecret() {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        
        val sharedPreferences = EncryptedSharedPreferences.create(
            context,
            "runinga_secure_config",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        
        val newSecret = generateSecret()
        sharedPreferences.edit().putString("hmac_secret", newSecret).apply()
        cachedSecret = newSecret
    }
    
    actual fun clearSecrets() {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        
        val sharedPreferences = EncryptedSharedPreferences.create(
            context,
            "runinga_secure_config",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        
        sharedPreferences.edit().remove("hmac_secret").apply()
        cachedSecret = null
    }
}
