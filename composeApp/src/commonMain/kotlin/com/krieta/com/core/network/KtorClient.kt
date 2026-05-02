package com.krieta.com.core.network


import com.krieta.com.core.security.TokenManager
import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.session.SessionManager
import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.providers.BearerTokens
import io.ktor.client.plugins.auth.providers.bearer
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.header
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.encodedPath
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.plugins.auth.providers.BearerAuthProvider
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.serialization.kotlinx.KotlinxWebsocketSerializationConverter
import io.ktor.client.plugins.ResponseException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import io.ktor.http.HttpStatusCode

object KtorClientFactory {

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        prettyPrint = false
        encodeDefaults = true
        coerceInputValues = true
        explicitNulls = false
    }

    fun create(tokenManager: TokenManager, deviceSecurity: DeviceSecurity? = null, sessionManager: SessionManager): HttpClient {
        return HttpClient {
            install(ContentNegotiation) {
                json(json)
            }

            install(WebSockets) {
                contentConverter = KotlinxWebsocketSerializationConverter(json)
                pingIntervalMillis = 20_000L
            }

            install(Auth) {
                bearer {
                    loadTokens {
                        val access = tokenManager.getAccessToken()
                        val refresh = tokenManager.getRefreshToken()
                        if (access != null && refresh != null) {
                            BearerTokens(access, refresh)
                        } else null
                    }
                    refreshTokens {
                        val refresh = tokenManager.getRefreshToken() ?: return@refreshTokens null
                        val deviceId = deviceSecurity?.getDeviceId() ?: "UNKNOWN_DEVICE"
                        
                        println("🔄 Token refresh triggered - attempting to refresh access token")
                        
                        try {
                            val response = client.post(ApiConstants.AUTH_REFRESH) {
                                setBody(mapOf("refreshToken" to refresh, "deviceId" to deviceId))
                            }
                            
                            if (response.status.value == 200) {
                                val tokens = response.body<com.krieta.feature.auth.data.remote.dto.AuthResponseDto>()
                                if (tokens.accessToken != null && tokens.refreshToken != null) {
                                    println("✅ Token refresh successful - new tokens saved")
                                    tokenManager.saveAccessToken(tokens.accessToken)
                                    tokenManager.saveRefreshToken(tokens.refreshToken)
                                    return@refreshTokens BearerTokens(tokens.accessToken, tokens.refreshToken)
                                } else {
                                    println("❌ Token refresh failed - invalid response structure")
                                }
                            } else {
                                println("❌ Token refresh failed - status: ${response.status.value}")
                            }
                            null
                        } catch (e: Exception) {
                            println("❌ Token refresh exception: ${e.message}")
                            CoroutineScope(Dispatchers.Main).launch {
                                tokenManager.clearTokens()
                                sessionManager.notifySessionExpired()
                            }
                            
                            // Check if it's a 401 error
                            if (e is ResponseException && e.response.status == HttpStatusCode.Unauthorized) {
                                println("❌ 401 during refresh - session expired")
                            }
                            null
                        }
                    }
                    sendWithoutRequest { request ->
                        val path = request.url.encodedPath
                        val host = request.url.host
                        
                        val isCloudinary = host.contains("cloudinary.com")
                        val isAuthRoute = path.contains("/auth/login") || 
                                          path.contains("/auth/register") || 
                                          path.contains("/auth/refresh")
                                          
                        // Send auth eagerly ONLY if it's NOT a cloudinary request and NOT an auth route
                        !isCloudinary && !isAuthRoute
                    }
                }
            }

            install(HttpTimeout) {
                connectTimeoutMillis = 15_000
                requestTimeoutMillis = 30_000
                socketTimeoutMillis = 30_000
            }

            install(Logging) {
                logger = object : Logger {
                    override fun log(message: String) {
                        // Debug-only logging — stripped in release via R8
                        println("KtorHttp: $message")
                    }
                }
                level = LogLevel.ALL
            }

            defaultRequest {
                url(ApiConstants.BASE_URL)
                contentType(ContentType.Application.Json)
            }
        }
    }
}
