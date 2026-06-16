package com.krieta.com.core.network

import io.ktor.client.HttpClient
import io.ktor.client.plugins.api.createClientPlugin
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.http.HttpMethod
import kotlinx.coroutines.runBlocking

val CsrfPlugin = createClientPlugin("CsrfPlugin", ::CsrfPluginConfig) {
    val csrfManager = pluginConfig.csrfManager
    
    onRequest { request, _ ->
        val requiresCsrf = request.method in listOf(HttpMethod.Post, HttpMethod.Put, HttpMethod.Patch, HttpMethod.Delete)
        val path = request.url.buildString()
        val isCsrfEndpoint = path.contains("/csrf-token")
        val isAuthRoute = path.contains("/auth/")
        
        if (requiresCsrf && !isCsrfEndpoint && !isAuthRoute) {
            val csrfToken = runBlocking { csrfManager.getCsrfToken(this@createClientPlugin.client) }
            if (csrfToken != null) {
                request.headers.append("X-CSRF-Token", csrfToken)
                println("🔒 Added CSRF token to ${request.method.value} $path")
            } else {
                println("⚠️ Could not fetch CSRF token for ${request.method.value} $path")
            }
        }
    }
}

class CsrfPluginConfig {
    lateinit var csrfManager: CsrfTokenManager
}
