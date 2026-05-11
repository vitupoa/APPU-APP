package com.krieta.com.core.network

sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val code: Int? = null, val message: String) : NetworkResult<Nothing>()
    data object Loading : NetworkResult<Nothing>()
}

val <T> NetworkResult<T>.isSuccess get() = this is NetworkResult.Success
val <T> NetworkResult<T>.isError get() = this is NetworkResult.Error
val <T> NetworkResult<T>.isLoading get() = this is NetworkResult.Loading

fun <T> NetworkResult<T>.getOrNull(): T? = when (this) {
    is NetworkResult.Success -> data
    else -> null
}

fun <T> NetworkResult<T>.getOrThrow(): T = when (this) {
    is NetworkResult.Success -> data
    is NetworkResult.Error -> throw RuntimeException("API Error ($code): $message")
    is NetworkResult.Loading -> throw IllegalStateException("Result is still loading")
}

inline fun <T, R> NetworkResult<T>.map(transform: (T) -> R): NetworkResult<R> = when (this) {
    is NetworkResult.Success -> NetworkResult.Success(transform(data))
    is NetworkResult.Error -> this
    is NetworkResult.Loading -> this
}

suspend inline fun <T> safeApiCall(crossinline block: suspend () -> T): NetworkResult<T> {
    return try {
        NetworkResult.Success(block())
    } catch (e: io.ktor.client.plugins.ClientRequestException) {
        println("❌ ClientRequestException (${e.response.status.value}): ${e.message}")
        when (e.response.status.value) {
            401 -> NetworkResult.Error(401, "Your session has expired. Please log in again.")
            403 -> NetworkResult.Error(403, "Access denied. You don't have permission to view this.")
            404 -> NetworkResult.Error(404, "The requested resource was not found.")
            else -> NetworkResult.Error(e.response.status.value, "Request failed. Please try again.")
        }
    } catch (e: io.ktor.client.plugins.ServerResponseException) {
        println("❌ ServerResponseException (${e.response.status.value}): ${e.message}")
        NetworkResult.Error(e.response.status.value, "Server error. Please try again later.")
    } catch (e: io.ktor.client.plugins.RedirectResponseException) {
        println("❌ RedirectResponseException: ${e.message}")
        NetworkResult.Error(e.response.status.value, "Unexpected redirect. Please try again.")
    } catch (e: kotlinx.io.IOException) {
        println("❌ IOException: ${e.message}")
        NetworkResult.Error(message = "No internet connection. Please check your network.")
    } catch (e: kotlinx.serialization.SerializationException) {
        println("❌ SerializationException: ${e.message}")
        println("❌ This usually means the API response doesn't match the expected DTO")
        NetworkResult.Error(message = "Unable to process server response. Please try again.")
    } catch (e: Exception) {
        println("❌ Unexpected Exception: ${e::class.simpleName} - ${e.message}")
        NetworkResult.Error(message = "Something went wrong. Please try again.")
    }
}
