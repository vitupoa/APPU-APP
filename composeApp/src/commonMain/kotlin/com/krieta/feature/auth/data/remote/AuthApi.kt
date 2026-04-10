package com.krieta.feature.auth.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.auth.data.remote.dto.AuthResponseDto
import com.krieta.feature.auth.data.remote.dto.LoginRequestDto
import com.krieta.feature.auth.data.remote.dto.OauthLoginRequestDto
import com.krieta.feature.auth.data.remote.dto.RegisterRequestDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class AuthApi(
    private val httpClient: HttpClient
) {
    suspend fun register(request: RegisterRequestDto): AuthResponseDto {
        return httpClient.post(ApiConstants.AUTH_REGISTER) {
            setBody(request)
        }.body()
    }

    suspend fun login(request: LoginRequestDto): AuthResponseDto {
        return httpClient.post(ApiConstants.AUTH_LOGIN) {
            setBody(request)
        }.body()
    }

    suspend fun oauthLogin(request: OauthLoginRequestDto): AuthResponseDto {
        return httpClient.post("${ApiConstants.API_VERSION}/auth/oauth/login") {
            setBody(request)
        }.body()
    }

    suspend fun refreshToken(refreshToken: String, deviceId: String): AuthResponseDto {
        @kotlinx.serialization.Serializable
        data class RefreshRequest(val refreshToken: String, val deviceId: String)
        
        return httpClient.post(ApiConstants.AUTH_REFRESH) {
            setBody(RefreshRequest(refreshToken, deviceId))
        }.body()
    }

    suspend fun logout(refreshToken: String, deviceId: String) {
        @kotlinx.serialization.Serializable
        data class LogoutRequest(val refreshToken: String, val deviceId: String)
        
        httpClient.post(ApiConstants.AUTH_LOGOUT) {
            setBody(LogoutRequest(refreshToken, deviceId))
        }
    }
}
