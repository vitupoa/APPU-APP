package com.runinga.feature.auth.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequestDto(
    val email: String? = null,
    val phone: String? = null,
    val username: String? = null,
    val password: String,
    @kotlinx.serialization.SerialName("device_id") val deviceId: String
)

@Serializable
data class RegisterRequestDto(
    val email: String,
    val password: String,
    @kotlinx.serialization.SerialName("first_name") val firstName: String,
    @kotlinx.serialization.SerialName("last_name") val lastName: String,
    val username: String,
    val phone: String? = null,
    @kotlinx.serialization.SerialName("account_type") val accountType: String,
    val country: String,
    val currency: String,
    @kotlinx.serialization.SerialName("device_id") val deviceId: String,
    val selectedNiches: List<String> = emptyList(),
    val customNiches: List<String> = emptyList()
)

@Serializable
data class OauthLoginRequestDto(
    val provider: String,
    val token: String,
    @kotlinx.serialization.SerialName("device_id") val deviceId: String,
    val country: String? = null,
    val currency: String? = null,
    @kotlinx.serialization.SerialName("account_type") val accountType: String? = null,
    val username: String? = null,
    @kotlinx.serialization.SerialName("first_name") val firstName: String? = null,
    @kotlinx.serialization.SerialName("last_name") val lastName: String? = null
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val phone: String? = null,
    val username: String,
    @kotlinx.serialization.SerialName("first_name") val firstName: String,
    @kotlinx.serialization.SerialName("last_name") val lastName: String,
    @kotlinx.serialization.SerialName("display_name") val displayName: String,
    @kotlinx.serialization.SerialName("avatar_url") val avatarUrl: String? = null,
    @kotlinx.serialization.SerialName("cover_photo_url") val coverPhotoUrl: String? = null,
    val bio: String? = null,
    val country: String,
    val currency: String,
    @kotlinx.serialization.SerialName("account_type") val accountType: String,
    @kotlinx.serialization.SerialName("is_verified") val isVerified: Boolean,
    @kotlinx.serialization.SerialName("is_wallet_unlocked") val isWalletUnlocked: Boolean,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null // Handled implicitly as ISO string
)

@Serializable
data class AuthResponseDto(
    val user: UserDto? = null,
    @kotlinx.serialization.SerialName("accessToken") val accessToken: String? = null,
    @kotlinx.serialization.SerialName("refreshToken") val refreshToken: String? = null,
    
    // Financial transaction security
    @kotlinx.serialization.SerialName("sessionSecret") val sessionSecret: String? = null,
    @kotlinx.serialization.SerialName("secretExpiresAt") val secretExpiresAt: Long? = null,
    
    // For oauth specific responses
    @kotlinx.serialization.SerialName("isNewUser") val isNewUser: Boolean? = null,
    val error: String? = null,
    val details: kotlinx.serialization.json.JsonElement? = null,
    val code: String? = null,
    val suggestions: List<String>? = null
)
