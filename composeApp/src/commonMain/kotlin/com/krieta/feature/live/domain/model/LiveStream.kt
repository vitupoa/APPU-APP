package com.krieta.feature.live.domain.model

data class LiveStream(
    val id: String,
    val hostId: String,
    val title: String,
    val description: String?,
    val thumbnailUrl: String?,
    val type: LiveStreamType,
    val status: LiveStreamStatus,
    val streamKey: String,
    val streamUrl: String?,
    val playbackUrl: String?,
    val viewerCount: Int,
    val peakViewers: Int,
    val likesCount: Int,
    val totalTipsKr: Double,
    val giftGoalTitle: String?,
    val giftGoalTarget: Double?,
    val giftGoalCurrent: Double,
    val isCoHostEnabled: Boolean,
    val host: LiveHost? = null,
    val pinnedProduct: LiveProduct? = null
)

data class LiveHost(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean
)

enum class LiveStreamType {
    NORMAL, CHAMA, CONTEST_BATTLE, PROOF_OF_TASK, COMMERCE
}

enum class LiveStreamStatus {
    SCHEDULED, LIVE, ENDED, CANCELLED
}

data class LiveMessage(
    val id: String,
    val streamId: String,
    val userId: String,
    val text: String,
    val isSystem: Boolean,
    val isPinned: Boolean,
    val user: LiveHost? = null
)

data class LiveProduct(
    val id: String,
    val title: String,
    val priceKr: Double,
    val imageUrl: String?,
    val whatsappNumber: String?
)
