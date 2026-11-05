package com.runinga.feature.contests.data.remote.dto

import com.runinga.feature.contests.domain.model.ContestSummary
import com.runinga.feature.contests.domain.model.JudgeInvite
import com.runinga.feature.contests.domain.model.JudgeInviteStatus

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
        prizeRc = prizeKr
    )
}
