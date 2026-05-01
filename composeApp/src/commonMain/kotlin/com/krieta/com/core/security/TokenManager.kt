package com.krieta.com.core.security

interface TokenManager {
    suspend fun saveAccessToken(token: String)
    suspend fun getAccessToken(): String?
    suspend fun saveRefreshToken(token: String)
    suspend fun getRefreshToken(): String?
    suspend fun clearTokens()
    suspend fun isLoggedIn(): Boolean
    
    // User session management
    suspend fun saveUserSession(session: UserSession)
    suspend fun getUserSession(): UserSession?
    suspend fun getUserId(): String?
    suspend fun getAdminRole(): String?
}
