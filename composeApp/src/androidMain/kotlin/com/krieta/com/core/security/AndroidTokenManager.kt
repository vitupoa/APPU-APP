package com.krieta.com.core.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString

class AndroidTokenManager(context: Context) : TokenManager {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "krieta_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun saveAccessToken(token: String) {
        prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    }

    override suspend fun getAccessToken(): String? {
        return prefs.getString(KEY_ACCESS_TOKEN, null)
    }

    override suspend fun saveRefreshToken(token: String) {
        prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
    }

    override suspend fun getRefreshToken(): String? {
        return prefs.getString(KEY_REFRESH_TOKEN, null)
    }

    override suspend fun clearTokens() {
        prefs.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .remove(KEY_USER_SESSION)
            .apply()
    }

    override suspend fun isLoggedIn(): Boolean {
        return getAccessToken() != null
    }
    
    override suspend fun saveUserSession(session: UserSession) {
        val sessionJson = json.encodeToString(session)
        prefs.edit().putString(KEY_USER_SESSION, sessionJson).apply()
    }
    
    override suspend fun getUserSession(): UserSession? {
        val sessionJson = prefs.getString(KEY_USER_SESSION, null) ?: return null
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
    
    override suspend fun getAdminRole(): String? {
        return getUserSession()?.adminRole
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_SESSION = "user_session"
    }
}
