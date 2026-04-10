package com.krieta.feature.auth.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequestDto(
    val email: String? = null,
    val phone: String? = null,
    val username: String? = null,
    val password: String,
    val deviceId: String
)

@Serializable
data class RegisterRequestDto(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val username: String,
    val phone: String? = null,
    val accountType: String,
    val country: String,
    val currency: String,
    val deviceId: String
)

@Serializable
data class OauthLoginRequestDto(
    val provider: String,
    val token: String,
    val deviceId: String,
    val country: String? = null,
    val currency: String? = null,
    val accountType: String? = null,
    val username: String? = null,
    val firstName: String? = null,
    val lastName: String? = null
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val phone: String? = null,
    val username: String,
    val firstName: String,
    val lastName: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val coverPhotoUrl: String? = null,
    val bio: String? = null,
    val country: String,
    val currency: String,
    val accountType: String,
    val isVerified: Boolean,
    val isWalletUnlocked: Boolean,
    val createdAt: String? = null // Handled implicitly as ISO string
)

@Serializable
data class AuthResponseDto(
    val user: UserDto? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    
    // For oauth specific responses
    val isNewUser: Boolean? = null,
    val error: String? = null,
    val code: String? = null,
    val suggestions: List<String>? = null
)
