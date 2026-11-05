package com.runinga.com.core.oauth

interface OAuthBrowser {
    suspend fun openAuthUrl(url: String, callbackScheme: String): OAuthResult
}

sealed class OAuthResult {
    data class Success(val code: String, val state: String) : OAuthResult()
    data class Error(val message: String) : OAuthResult()
    object Cancelled : OAuthResult()
}
