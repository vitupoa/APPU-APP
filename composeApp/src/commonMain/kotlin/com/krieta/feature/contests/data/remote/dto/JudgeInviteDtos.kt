package com.krieta.feature.contests.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class JudgeInviteRequestDto(
    val judgeIds: List<String>
)

@Serializable
data class JudgeInviteDto(
    val id: String,
    val contestId: String,
    val judgeId: String,
    val status: String, // PENDING, ACCEPTED, DECLINED
    val invitedAt: String,
    val respondedAt: String? = null,
    val contest: ContestSummaryDto? = null
)

@Serializable
data class ContestSummaryDto(
    val id: String,
    val title: String,
    val description: String,
    val coverMediaUrl: String? = null,
    val creatorUsername: String,
    val creatorDisplayName: String,
    val deadline: String,
    val prizeKr: Double
)

@Serializable
data class JudgeInviteResponseDto(
    val accepted: List<JudgeInviteDto>,
    val failed: List<String> = emptyList()
)

@Serializable
data class AcceptDeclineInviteRequestDto(
    val inviteId: String
)
