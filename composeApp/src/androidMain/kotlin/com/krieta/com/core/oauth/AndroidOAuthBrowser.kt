package com.krieta.com.core.oauth

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class AndroidOAuthBrowser(private val context: Context) : OAuthBrowser {
    
    private var pendingCallback: ((OAuthResult) -> Unit)? = null
    
    override suspend fun openAuthUrl(url: String, callbackScheme: String): OAuthResult {
        return suspendCancellableCoroutine { continuation ->
            pendingCallback = { result ->
                continuation.resume(result)
                pendingCallback = null
            }
            
            val customTabsIntent = CustomTabsIntent.Builder()
                .setShowTitle(true)
                .build()
            
            customTabsIntent.launchUrl(context, Uri.parse(url))
        }
    }
    
    fun handleCallback(uri: Uri) {
        val code = uri.getQueryParameter("code")
        val state = uri.getQueryParameter("state")
        val error = uri.getQueryParameter("error")
        
        val result = when {
            error != null -> OAuthResult.Error(error)
            code != null && state != null -> OAuthResult.Success(code, state)
            else -> OAuthResult.Error("Invalid callback")
        }
        
        pendingCallback?.invoke(result)
    }
    
    fun handleCancellation() {
        pendingCallback?.invoke(OAuthResult.Cancelled)
    }
}
