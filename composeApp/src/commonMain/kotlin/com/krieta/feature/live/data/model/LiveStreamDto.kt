package com.krieta.feature.live.data.model

import kotlinx.serialization.Serializable

@Serializable
data class LiveStreamDto(
    val id: String,
    val hostId: String,
    val title: String,
    val description: String?,
    val thumbnailUrl: String?,
    val type: String,
    val status: String,
    val streamKey: String,
    val streamUrl: String?,
    val playbackUrl: String?,
    val viewerCount: Int,
    val peakViewers: Int,
    val likesCount: Int,
    val totalTipsKr: Double,
    val totalSalesKr: Double,
    val giftGoalTitle: String?,
    val giftGoalTarget: Double?,
    val giftGoalCurrent: Double,
    val isCoHostEnabled: Boolean,
    val maxCoHosts: Int,
    val host: LiveHostDto? = null
)

@Serializable
data class LiveHostDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean
)

@Serializable
data class LiveMessageDto(
    val id: String,
    val streamId: String,
    val userId: String,
    val text: String,
    val isSystem: Boolean,
    val isPinned: Boolean,
    val user: LiveHostDto? = null
)

@Serializable
data class LiveTipDto(
    val success: Boolean,
    val krTipped: Double,
    val krReceived: Double,
    val platformFee: Double,
    val sender: LiveHostDto?,
    val giftType: String?,
    val message: String?
)

@Serializable
data class ActiveStreamsResponseDto(
    val streams: List<LiveStreamDto>,
    val total: Int,
    val page: Int,
    val limit: Int
)
