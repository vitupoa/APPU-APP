package com.krieta.feature.auth.domain.model

data class User(
    val id: String,
    val username: String,
    val email: String,
    val displayName: String,
    val accountType: String,
    val isWalletUnlocked: Boolean
)
