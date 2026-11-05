package com.runinga.com.core.security

import kotlinx.serialization.Serializable

@Serializable
data class UserSession(
    val userId: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val adminRole: String? = null
)
