package com.krieta.com.core.network

import com.krieta.com.core.security.TokenManager
import com.krieta.com.core.session.SessionManager
import io.ktor.client.plugins.ClientRequestException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

suspend inline fun <T> authenticatedApiCall(
    tokenManager: TokenManager,
    sessionManager: SessionManager,
    crossinline block: suspend () -> T
): NetworkResult<T> {
    return try {
        NetworkResult.Success(block())
    } catch (e: ClientRequestException) {
        when (e.response.status.value) {
            401 -> {
                println("❌ Authentication failed (401) - Clearing tokens")
                tokenManager.clearTokens()
                CoroutineScope(Dispatchers.Main).launch {
                    sessionManager.notifySessionExpired()
                }
                NetworkResult.Error(
                    code = 401,
                    message = "Your session has expired. Please login again."
                )
            }
            else -> {
                println("❌ API Error (${e.response.status.value}): ${e.message}")
                NetworkResult.Error(e.response.status.value, "Error: ${e.message}")
            }
        }
    } catch (e: io.ktor.client.plugins.ServerResponseException) {
        println("❌ Server Error (${e.response.status.value}): ${e.message}")
        NetworkResult.Error(e.response.status.value, "Server error: ${e.message}")
    } catch (e: kotlinx.io.IOException) {
        println("❌ Network Error: ${e.message}")
        NetworkResult.Error(message = "Network error. Please check your connection.")
    } catch (e: kotlinx.serialization.SerializationException) {
        println("❌ Serialization Error: ${e.message}")
        println("❌ This usually means the API returned an error response instead of data")
        NetworkResult.Error(message = "Unable to process response. Please try again.")
    } catch (e: Exception) {
        println("❌ Unexpected Error: ${e::class.simpleName} - ${e.message}")
        NetworkResult.Error(message = e.message ?: "An unexpected error occurred")
    }
}
