package com.krieta.feature.auth.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.security.TokenManager
import com.krieta.com.core.security.UserSession
import com.krieta.feature.auth.data.remote.AuthApi
import com.krieta.feature.auth.data.remote.dto.LoginRequestDto
import com.krieta.feature.auth.data.remote.dto.OauthLoginRequestDto
import com.krieta.feature.auth.data.remote.dto.RegisterRequestDto
import com.krieta.feature.auth.domain.model.User
import com.krieta.feature.auth.domain.repository.AuthRepository
import io.ktor.client.HttpClient
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.authProvider
import io.ktor.client.plugins.auth.providers.BearerAuthProvider
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class AuthRepositoryImpl(
    private val api: AuthApi,
    private val tokenManager: TokenManager,
    private val deviceSecurity: DeviceSecurity,
    private val httpClient: HttpClient
) : AuthRepository {

    private val _currentUser = MutableStateFlow<User?>(null)
    override val currentUser: Flow<User?> = _currentUser.asStateFlow()

    /**
     * Invalidate Ktor's cached bearer tokens so loadTokens is re-invoked
     * on the next request, picking up the freshly saved tokens.
     */
    private fun invalidateBearerCache() {
        try {
            httpClient.authProvider<BearerAuthProvider>()?.clearToken()
        } catch (_: Exception) { /* Auth plugin not installed — safe to ignore */ }
    }

    private fun mapUser(dto: com.krieta.feature.auth.data.remote.dto.UserDto): User {
        return User(
            id = dto.id,
            email = dto.email,
            phone = dto.phone,
            username = dto.username,
            firstName = dto.firstName,
            lastName = dto.lastName,
            displayName = dto.displayName,
            avatarUrl = dto.avatarUrl,
            coverPhotoUrl = dto.coverPhotoUrl,
            bio = dto.bio,
            country = dto.country,
            currency = dto.currency,
            accountType = dto.accountType,
            isVerified = dto.isVerified,
            isWalletUnlocked = dto.isWalletUnlocked,
            createdAt = dto.createdAt
        )
    }

    override suspend fun register(request: RegisterRequestDto): NetworkResult<User> {
        return safeApiCall {
            val response = api.register(request)
            
            if (response.error != null) {
                val detailsStr = response.details?.toString() ?: ""
                throw IllegalStateException("${response.error} $detailsStr".trim())
            }

            response.accessToken?.let { tokenManager.saveAccessToken(it) }
            response.refreshToken?.let { tokenManager.saveRefreshToken(it) }
            invalidateBearerCache()
            
            val user = response.user?.let { mapUser(it) }
                ?: throw IllegalStateException("Login failed: Invalid server response")
            
            // Save user session for quick access
            tokenManager.saveUserSession(
                UserSession(
                    userId = user.id,
                    username = user.username,
                    displayName = user.displayName,
                    avatarUrl = user.avatarUrl
                )
            )
            
            _currentUser.value = user
            user
        }
    }

    override suspend fun login(request: LoginRequestDto): NetworkResult<User> {
        return safeApiCall {
            val response = api.login(request)
            
            if (response.error != null) {
                val detailsStr = response.details?.toString() ?: ""
                throw IllegalStateException("${response.error} $detailsStr".trim())
            }

            response.accessToken?.let { tokenManager.saveAccessToken(it) }
            response.refreshToken?.let { tokenManager.saveRefreshToken(it) }
            invalidateBearerCache()
            
            val user = response.user?.let { mapUser(it) }
                ?: throw IllegalStateException("Login failed: Invalid server response")
            
            // Save user session for quick access
            tokenManager.saveUserSession(
                UserSession(
                    userId = user.id,
                    username = user.username,
                    displayName = user.displayName,
                    avatarUrl = user.avatarUrl
                )
            )
            
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
            invalidateBearerCache()

            val user = mapUser(response.user)
            
            // Save user session for quick access
            tokenManager.saveUserSession(
                UserSession(
                    userId = user.id,
                    username = user.username,
                    displayName = user.displayName,
                    avatarUrl = user.avatarUrl
                )
            )
            
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
            invalidateBearerCache()
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
