package com.runinga.feature.auth.domain.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.auth.data.remote.dto.LoginRequestDto
import com.runinga.feature.auth.data.remote.dto.OauthLoginRequestDto
import com.runinga.feature.auth.data.remote.dto.RegisterRequestDto
import com.runinga.feature.auth.domain.model.User
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val currentUser: Flow<User?>
    
    suspend fun register(request: RegisterRequestDto): NetworkResult<User>
    suspend fun login(request: LoginRequestDto): NetworkResult<User>
    suspend fun oauthLogin(request: OauthLoginRequestDto): NetworkResult<User>
    suspend fun logout(): NetworkResult<Unit>
    suspend fun refreshToken(): NetworkResult<Unit>
    
    suspend fun isAuthenticated(): Boolean
}
