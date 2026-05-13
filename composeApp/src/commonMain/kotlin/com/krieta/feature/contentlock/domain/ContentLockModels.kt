package com.krieta.feature.contentlock.domain

data class ContentLockInfo(
    val isLocked: Boolean,
    val hasAccess: Boolean,
    val unlockAmountKr: Int?,
    val requiresSubscription: Boolean,
    val requiresUnlock: Boolean,
    val unlockPrice: UnlockPrice? = null
)

data class UnlockPrice(
    val krAmount: Int,
    val fiatAmount: Double,
    val currency: String,
    val displayText: String
)

enum class ContentType {
    SHORT, POST;
    
    override fun toString(): String = name
}
