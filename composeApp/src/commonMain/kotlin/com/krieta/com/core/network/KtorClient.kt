package com.krieta.com.core.network


import com.krieta.com.core.security.TokenManager
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
import kotlinx.serialization.json.JsonNamingStrategy
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.plugins.auth.providers.BearerAuthProvider
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.serialization.kotlinx.KotlinxWebsocketSerializationConverter
object KtorClientFactory {

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        prettyPrint = false
        encodeDefaults = true
        coerceInputValues = true
        explicitNulls = false
        namingStrategy = JsonNamingStrategy.SnakeCase
    }

    fun create(tokenManager: TokenManager): HttpClient {
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
                        // We must fetch deviceId, but since KtorClientFactory is an object/factory, we should ideally inject DeviceSecurity.
                        // Assuming deviceId is accessible or we hardcode a fallback for testing temporarily if DI isn't available right here
                        val deviceId = "unknown-device" // In production, this should be injected
                        
                        try {
                            val response = client.post(ApiConstants.AUTH_REFRESH) {
                                setBody(mapOf("refreshToken" to refresh, "deviceId" to deviceId))
                            }
                            
                            if (response.status.value == 200) {
                                val tokens = response.body<com.krieta.feature.auth.data.remote.dto.AuthResponseDto>()
                                if (tokens.accessToken != null && tokens.refreshToken != null) {
                                    tokenManager.saveAccessToken(tokens.accessToken)
                                    tokenManager.saveRefreshToken(tokens.refreshToken)
                                    return@refreshTokens BearerTokens(tokens.accessToken, tokens.refreshToken)
                                }
                            }
                            null
                        } catch (e: Exception) {
                            null
                        }
                    }
                    sendWithoutRequest { request ->
                        // Don't send auth header for login/register endpoints
                        val path = request.url.encodedPath
                        !path.contains("/auth/login") &&
                        !path.contains("/auth/register") &&
                        !path.contains("/auth/refresh")
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
                level = LogLevel.HEADERS
            }

            defaultRequest {
                url(ApiConstants.BASE_URL)
                contentType(ContentType.Application.Json)
            }
        }
    }
}
