package com.runinga.feature.auth.domain.model

data class User(
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
    val createdAt: String? = null
)
