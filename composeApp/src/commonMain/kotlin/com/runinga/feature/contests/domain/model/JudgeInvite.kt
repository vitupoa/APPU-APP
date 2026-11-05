package com.runinga.feature.contests.domain.model

enum class JudgeInviteStatus {
    PENDING,
    ACCEPTED,
    DECLINED
}

data class JudgeInvite(
    val id: String,
    val contestId: String,
    val judgeId: String,
    val status: JudgeInviteStatus,
    val invitedAt: String,
    val respondedAt: String? = null,
    val contest: ContestSummary? = null
)

data class ContestSummary(
    val id: String,
    val title: String,
    val description: String,
    val coverMediaUrl: String? = null,
    val creatorUsername: String,
    val creatorDisplayName: String,
    val deadline: String,
    val prizeKr: Double
)
