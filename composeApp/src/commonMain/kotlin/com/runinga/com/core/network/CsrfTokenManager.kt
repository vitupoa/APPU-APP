package com.runinga.com.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable

@Serializable
data class CsrfTokenResponse(
    val csrfToken: String,
    val expiresIn: Int
)

class CsrfTokenManager {
    private var cachedToken: String? = null
    private var tokenExpiryTime: Long = 0
    private val mutex = Mutex()
    
    suspend fun getCsrfToken(client: HttpClient): String? = mutex.withLock {
        try {
            if (cachedToken != null && System.currentTimeMillis() < tokenExpiryTime) {
                return cachedToken
            }
            
            val response = client.get("${ApiConstants.BASE_URL}/api/v1/csrf-token")
            if (response.status == HttpStatusCode.OK) {
                val tokenResponse = response.body<CsrfTokenResponse>()
                cachedToken = tokenResponse.csrfToken
                tokenExpiryTime = System.currentTimeMillis() + (50 * 60 * 1000)
                println("✅ CSRF token fetched: ${cachedToken?.take(8)}...")
                return cachedToken
            } else {
                println("❌ Failed to fetch CSRF token: ${response.status}")
                return null
            }
        } catch (e: Exception) {
            println("❌ Error fetching CSRF token: ${e.message}")
            return null
        }
    }
    
    fun clearToken() {
        cachedToken = null
        tokenExpiryTime = 0
    }
}
