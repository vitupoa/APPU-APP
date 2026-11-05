package com.runinga.feature.contests.data.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.safeApiCall
import com.runinga.feature.contests.data.remote.ContestsApi
import com.runinga.feature.contests.data.remote.dto.ContestDto
import com.runinga.feature.contests.data.remote.dto.ContestSubmissionDto
import com.runinga.feature.contests.data.remote.dto.SubmitEntryRequestDto
import com.runinga.feature.contests.data.remote.dto.toDomain
import com.runinga.feature.contests.domain.model.Contest
import com.runinga.feature.contests.domain.model.ContestAction
import com.runinga.feature.contests.domain.model.ContestCategory
import com.runinga.feature.contests.domain.model.ContestCreator
import com.runinga.feature.contests.domain.model.ContestMediaType
import com.runinga.feature.contests.domain.model.ContestRequirements
import com.runinga.feature.contests.domain.model.ContestStatus
import com.runinga.feature.contests.domain.model.ContestSubmission
import com.runinga.feature.contests.domain.model.JudgingCriteria
import com.runinga.feature.contests.domain.model.RequiredAction
import com.runinga.feature.contests.domain.repository.ContestListResult
import com.runinga.feature.contests.domain.repository.ContestsRepository
import com.runinga.feature.contests.domain.repository.SubmissionsResult

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

    override suspend fun getContestById(contestId: String): NetworkResult<Contest> {
        return getContest(contestId)
    }

    override suspend fun joinContest(contestId: String): NetworkResult<Unit> {
        // Task 14.1: Validate individual registration against contest participation type
        // First, get the contest details to check participation type
        val contestResult = getContest(contestId)
        
        return when (contestResult) {
            is NetworkResult.Success -> {
                val contest = contestResult.data
                
                // Validate individual registration is allowed
                val validationResult = com.runinga.feature.contests.domain.validation.TeamParticipationValidator
                    .validateIndividualRegistration(contest)
                
                if (validationResult is com.runinga.feature.contests.domain.validation.ValidationResult.Error) {
                    NetworkResult.Error(code = null, message = validationResult.message)
                } else {
                    // Proceed with registration if validation passes
                    safeApiCall { api.joinContest(contestId) }
                }
            }
            is NetworkResult.Error -> contestResult
            else -> NetworkResult.Error(code = null, message = "Failed to validate contest participation type")
        }
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

    override suspend fun createContest(request: com.runinga.feature.contests.data.remote.dto.CreateContestRequestDto): NetworkResult<String> {
        return safeApiCall { 
            val response = api.createContest(request)
            response.contestId ?: throw Exception(response.error ?: response.message ?: "Contest creation failed")
        }
    }

    override suspend fun getContestRequirements(contestId: String): NetworkResult<ContestRequirements> {
        return safeApiCall {
            val dto = api.getContestRequirements(contestId)
            ContestRequirements(
                actions = dto.actions.map { ContestAction(it.id, it.actionType, it.targetUrl, it.label, it.isVerifiable, it.requiresUpload, it.sortOrder) },
                hasSubmitted = dto.hasSubmitted,
                canSubmit = dto.canSubmit
            )
        }
    }

    override suspend fun submitEntry(contestId: String, mediaUrl: String, mediaType: String, proofUrls: List<String>): NetworkResult<Unit> {
        // Task 14.1: Validate individual submission against contest participation type
        // First, get the contest details to check participation type
        val contestResult = getContest(contestId)
        
        return when (contestResult) {
            is NetworkResult.Success -> {
                val contest = contestResult.data
                
                // Validate individual submission is allowed
                val validationResult = com.runinga.feature.contests.domain.validation.TeamParticipationValidator
                    .validateIndividualRegistration(contest)
                
                if (validationResult is com.runinga.feature.contests.domain.validation.ValidationResult.Error) {
                    NetworkResult.Error(code = null, message = validationResult.message)
                } else {
                    // Proceed with submission if validation passes
                    safeApiCall {
                        api.submitEntry(contestId, SubmitEntryRequestDto(mediaUrl, mediaType, proofUrls))
                    }
                }
            }
            is NetworkResult.Error -> contestResult
            else -> NetworkResult.Error(code = null, message = "Failed to validate contest participation type")
        }
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
        prizeRc = prizeKr,
        platformFeeRc = platformFeeKr,
        totalChargedRc = totalChargedKr,
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
        createdAt = createdAt,
        // Task 14.1: Map team participation fields
        participationType = com.runinga.feature.contests.domain.model.ParticipationType.fromString(participationType),
        teamSize = teamSize,
        maxTeams = maxTeams,
        registeredTeamsCount = registeredTeamsCount
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
    
    // Judge Invite Methods Implementation
    override suspend fun inviteJudges(contestId: String, judgeIds: List<String>): NetworkResult<List<com.runinga.feature.contests.domain.model.JudgeInvite>> {
        return safeApiCall {
            val request = com.runinga.feature.contests.data.remote.dto.JudgeInviteRequestDto(judgeIds)
            val response = api.inviteJudges(contestId, request)
            response.accepted.map { it.toDomain() }
        }
    }
    
    override suspend fun getJudgeInvitations(): NetworkResult<List<com.runinga.feature.contests.domain.model.JudgeInvite>> {
        return safeApiCall {
            api.getJudgeInvitations().map { it.toDomain() }
        }
    }
    
    override suspend fun acceptJudgeInvite(inviteId: String): NetworkResult<Unit> {
        return safeApiCall {
            api.acceptJudgeInvite(inviteId)
        }
    }
    
    override suspend fun declineJudgeInvite(inviteId: String): NetworkResult<Unit> {
        return safeApiCall {
            api.declineJudgeInvite(inviteId)
        }
    }
    
    override suspend fun voteSubmission(submissionId: String): NetworkResult<Unit> {
        return safeApiCall {
            val fingerprint = com.runinga.com.core.util.DeviceFingerprint.getFingerprint()
            api.voteSubmission(submissionId, fingerprint)
        }
    }
}
