package com.krieta.feature.contests.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.contests.data.remote.ContestsApi
import com.krieta.feature.contests.data.remote.dto.ContestDto
import com.krieta.feature.contests.data.remote.dto.ContestSubmissionDto
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.model.ContestCategory
import com.krieta.feature.contests.domain.model.ContestCreator
import com.krieta.feature.contests.domain.model.ContestMediaType
import com.krieta.feature.contests.domain.model.ContestStatus
import com.krieta.feature.contests.domain.model.ContestSubmission
import com.krieta.feature.contests.domain.model.JudgingCriteria
import com.krieta.feature.contests.domain.model.RequiredAction
import com.krieta.feature.contests.domain.repository.ContestListResult
import com.krieta.feature.contests.domain.repository.ContestsRepository
import com.krieta.feature.contests.domain.repository.SubmissionsResult

class ContestsRepositoryImpl(
    private val api: ContestsApi
) : ContestsRepository {

    override suspend fun listContests(status: String?, cursor: String?): NetworkResult<ContestListResult> {
        return safeApiCall {
            val dto = api.listContests(status, cursor)
            ContestListResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }
    }

    override suspend fun getContest(contestId: String): NetworkResult<Contest> {
        return safeApiCall { api.getContest(contestId).toDomain() }
    }

    override suspend fun joinContest(contestId: String): NetworkResult<Unit> {
        return safeApiCall { api.joinContest(contestId) }
    }

    override suspend fun getSubmissions(contestId: String, cursor: String?): NetworkResult<SubmissionsResult> {
        return safeApiCall {
            val dto = api.getSubmissions(contestId, cursor)
            SubmissionsResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }
    }

    override suspend fun getLeaderboard(contestId: String): NetworkResult<List<ContestSubmission>> {
        return safeApiCall { api.getLeaderboard(contestId).map { it.toDomain() } }
    }

    override suspend fun createContest(request: com.krieta.feature.contests.data.remote.dto.CreateContestRequestDto): NetworkResult<Unit> {
        return safeApiCall { api.createContest(request); Unit }
    }

    private fun ContestDto.toDomain(): Contest = Contest(
        id = id,
        creator = ContestCreator(
            id = creator.id,
            username = creator.username,
            displayName = creator.displayName,
            avatarUrl = creator.avatarUrl
        ),
        title = title,
        description = description,
        mediaType = parseMediaType(mediaType),
        contestCategory = parseCategory(contestCategory),
        prizeKr = prizeKr,
        platformFeeKr = platformFeeKr,
        totalChargedKr = totalChargedKr,
        rules = rules,
        requiredActions = requiredActions.map { RequiredAction(it.type, it.targetUrl, it.label) },
        maxWinners = maxWinners,
        judgingCriteria = parseCriteria(judgingCriteria),
        sponsorName = sponsorName,
        sponsorUrl = sponsorUrl,
        deadline = deadline,
        coverMediaUrl = coverMediaUrl,
        status = parseStatus(status),
        participantsCount = participantsCount,
        submissionsCount = submissionsCount,
        isJoined = isJoined,
        createdAt = createdAt
    )

    private fun ContestSubmissionDto.toDomain(): ContestSubmission = ContestSubmission(
        id = id,
        user = ContestCreator(user.id, user.username, user.displayName, user.avatarUrl),
        contestId = contestId,
        mediaUrl = mediaUrl,
        mediaType = mediaType,
        proofScreenshots = proofScreenshots,
        votes = votes,
        rank = rank,
        createdAt = createdAt
    )

    private fun parseMediaType(value: String) = try {
        ContestMediaType.valueOf(value)
    } catch (_: Exception) { ContestMediaType.PHOTO }

    private fun parseCategory(value: String) = try {
        ContestCategory.valueOf(value)
    } catch (_: Exception) { ContestCategory.CREATIVE }

    private fun parseCriteria(value: String) = try {
        JudgingCriteria.valueOf(value)
    } catch (_: Exception) { JudgingCriteria.CREATOR_PICKS }

    private fun parseStatus(value: String) = try {
        ContestStatus.valueOf(value)
    } catch (_: Exception) { ContestStatus.ACTIVE }
}
