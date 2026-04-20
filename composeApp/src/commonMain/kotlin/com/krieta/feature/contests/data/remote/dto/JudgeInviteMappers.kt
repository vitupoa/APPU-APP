package com.krieta.feature.contests.data.remote.dto

import com.krieta.feature.contests.domain.model.ContestSummary
import com.krieta.feature.contests.domain.model.JudgeInvite
import com.krieta.feature.contests.domain.model.JudgeInviteStatus

fun JudgeInviteDto.toDomain(): JudgeInvite {
    return JudgeInvite(
        id = id,
        contestId = contestId,
        judgeId = judgeId,
        status = when (status) {
            "ACCEPTED" -> JudgeInviteStatus.ACCEPTED
            "DECLINED" -> JudgeInviteStatus.DECLINED
            else -> JudgeInviteStatus.PENDING
        },
        invitedAt = invitedAt,
        respondedAt = respondedAt,
        contest = contest?.toDomain()
    )
}

fun ContestSummaryDto.toDomain(): ContestSummary {
    return ContestSummary(
        id = id,
        title = title,
        description = description,
        coverMediaUrl = coverMediaUrl,
        creatorUsername = creatorUsername,
        creatorDisplayName = creatorDisplayName,
        deadline = deadline,
        prizeKr = prizeKr
    )
}
