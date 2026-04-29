package com.krieta.com.core.oauth

import kotlinx.cinterop.ExperimentalForeignApi
import platform.AuthenticationServices.*
import platform.Foundation.NSURL
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

@OptIn(ExperimentalForeignApi::class)
class IOSOAuthBrowser : OAuthBrowser {
    
    override suspend fun openAuthUrl(url: String, callbackScheme: String): OAuthResult {
        return suspendCancellableCoroutine { continuation ->
            val nsUrl = NSURL.URLWithString(url) ?: run {
                continuation.resume(OAuthResult.Error("Invalid URL"))
                return@suspendCancellableCoroutine
            }
            
            val session = ASWebAuthenticationSession(
                uRL = nsUrl,
                callbackURLScheme = callbackScheme
            ) { callbackUrl, error ->
                when {
                    error != null -> {
                        val errorCode = error.code
                        if (errorCode == ASWebAuthenticationSessionErrorCodeCanceledLogin) {
                            continuation.resume(OAuthResult.Cancelled)
                        } else {
                            continuation.resume(OAuthResult.Error(error.localizedDescription))
                        }
                    }
                    callbackUrl != null -> {
                        val urlString = callbackUrl.absoluteString ?: ""
                        val code = extractQueryParam(urlString, "code")
                        val state = extractQueryParam(urlString, "state")
                        
                        if (code != null && state != null) {
                            continuation.resume(OAuthResult.Success(code, state))
                        } else {
                            continuation.resume(OAuthResult.Error("Missing code or state"))
                        }
                    }
                    else -> continuation.resume(OAuthResult.Error("Unknown error"))
                }
            }
            
            session.prefersEphemeralWebBrowserSession = false
            session.start()
            
            continuation.invokeOnCancellation {
                session.cancel()
            }
        }
    }
    
    private fun extractQueryParam(url: String, param: String): String? {
        val regex = Regex("$param=([^&]+)")
        return regex.find(url)?.groupValues?.get(1)
    }
}
