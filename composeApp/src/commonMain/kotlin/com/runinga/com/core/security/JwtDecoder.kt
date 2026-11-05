package com.runinga.com.core.security

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

@Serializable
data class JwtPayload(
    val userId: String,
    val deviceId: String? = null,
    val isAdmin: Boolean? = null,
    val isWalletUnlocked: Boolean? = null,
    val accountType: String? = null,
    val exp: Long? = null,
    val iat: Long? = null
)

object JwtDecoder {
    private val json = Json { ignoreUnknownKeys = true }
    
    @OptIn(ExperimentalEncodingApi::class)
    fun decodePayload(token: String): JwtPayload? {
        return try {
            val parts = token.split(".")
            if (parts.size != 3) return null
            
            val payload = parts[1]
            val decodedBytes = Base64.UrlSafe.decode(payload)
            val decodedString = decodedBytes.decodeToString()
            
            json.decodeFromString<JwtPayload>(decodedString)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    fun getUserId(token: String): String? {
        return decodePayload(token)?.userId
    }
}
