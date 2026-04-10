package com.krieta.feature.auth.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.security.TokenManager
import com.krieta.feature.auth.data.remote.AuthApi
import com.krieta.feature.auth.data.remote.dto.LoginRequestDto
import com.krieta.feature.auth.data.remote.dto.OauthLoginRequestDto
import com.krieta.feature.auth.data.remote.dto.RegisterRequestDto
import com.krieta.feature.auth.domain.model.User
import com.krieta.feature.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class AuthRepositoryImpl(
    private val api: AuthApi,
    private val tokenManager: TokenManager,
    private val deviceSecurity: DeviceSecurity
) : AuthRepository {

    private val _currentUser = MutableStateFlow<User?>(null)
    override val currentUser: Flow<User?> = _currentUser.asStateFlow()

    private fun mapUser(dto: com.krieta.feature.auth.data.remote.dto.UserDto): User {
        return User(
            id = dto.id,
            username = dto.username,
            email = dto.email,
            displayName = dto.displayName,
            accountType = dto.accountType,
            isWalletUnlocked = dto.isWalletUnlocked
        )
    }

    override suspend fun register(request: RegisterRequestDto): NetworkResult<User> {
        return safeApiCall {
            val response = api.register(request)
            
            response.accessToken?.let { tokenManager.saveAccessToken(it) }
            response.refreshToken?.let { tokenManager.saveRefreshToken(it) }
            
            val user = response.user?.let { mapUser(it) }
                ?: throw IllegalStateException("Backend returned success without User object")
            
            _currentUser.value = user
            user
        }
    }

    override suspend fun login(request: LoginRequestDto): NetworkResult<User> {
        return safeApiCall {
            val response = api.login(request)
            
            response.accessToken?.let { tokenManager.saveAccessToken(it) }
            response.refreshToken?.let { tokenManager.saveRefreshToken(it) }
            
            val user = response.user?.let { mapUser(it) }
                ?: throw IllegalStateException("Backend returned success without User object")
            
            _currentUser.value = user
            user
        }
    }

    override suspend fun oauthLogin(request: OauthLoginRequestDto): NetworkResult<User> {
        return safeApiCall {
            val response = api.oauthLogin(request)
            
            if (response.user == null) {
                throw IllegalArgumentException(
                    response.error ?: "Missing required OAuth parameters"
                )
            }

            response.accessToken?.let { tokenManager.saveAccessToken(it) }
            response.refreshToken?.let { tokenManager.saveRefreshToken(it) }

            val user = mapUser(response.user)
            _currentUser.value = user
            user
        }
    }

    override suspend fun logout(): NetworkResult<Unit> {
        return safeApiCall {
            val refresh = tokenManager.getRefreshToken()
            val deviceId = deviceSecurity.getDeviceId()
            if (refresh != null) {
                try {
                    api.logout(refreshToken = refresh, deviceId = deviceId)
                } catch (_: Exception) {
                    // Force local logout even if server call fails
                }
            }
            clearSession()
        }
    }

    override suspend fun refreshToken(): NetworkResult<Unit> {
        return safeApiCall {
            val refresh = tokenManager.getRefreshToken()
                ?: throw IllegalStateException("No refresh token")
            val deviceId = deviceSecurity.getDeviceId()
            val result = api.refreshToken(refreshToken = refresh, deviceId = deviceId)
            
            result.accessToken?.let { tokenManager.saveAccessToken(it) }
            result.refreshToken?.let { tokenManager.saveRefreshToken(it) }
        }
    }

    override suspend fun isAuthenticated(): Boolean {
        return tokenManager.getAccessToken() != null
    }

    private suspend fun clearSession() {
        tokenManager.clearTokens()
        _currentUser.value = null
    }
}
