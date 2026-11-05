package com.runinga.feature.contests.data.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.safeApiCall
import com.runinga.feature.contests.data.remote.TeamsApi
import com.runinga.feature.contests.data.remote.dto.*
import com.runinga.feature.contests.domain.model.Contest
import com.runinga.feature.contests.domain.repository.TeamsRepository
import com.runinga.feature.contests.domain.validation.TeamParticipationValidator
import com.runinga.feature.contests.domain.validation.ValidationResult

/**
 * Implementation of TeamsRepository with team participation validation.
 * Task 14.1: Update Teams Module to handle contest participation types
 */
class TeamsRepositoryImpl(
    private val api: TeamsApi
) : TeamsRepository {
    
    /**
     * Registers a team for a contest with validation.
     * 
     * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
     */
    override suspend fun registerTeamForContest(
        contestId: String,
        teamId: String,
        contest: Contest,
        team: TeamDto
    ): NetworkResult<Unit> {
        // Task 14.1: Validate team registration against contest participation type
        val validationResult = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        if (validationResult is ValidationResult.Error) {
            return NetworkResult.Error(code = null, message = validationResult.message)
        }
        
        // Proceed with registration if validation passes
        return safeApiCall {
            api.registerTeamForContest(contestId, teamId)
        }
    }
    
    /**
     * Submits a team entry for a contest with validation.
     * 
     * Requirements: 16.1, 16.2, 16.3, 16.4
     */
    override suspend fun submitTeamEntry(
        contestId: String,
        teamId: String,
        request: SubmitTeamEntryRequest,
        contest: Contest
    ): NetworkResult<Unit> {
        // Task 14.1: Validate team submission against contest participation type
        val validationResult = TeamParticipationValidator.validateTeamSubmission(contest)
        
        if (validationResult is ValidationResult.Error) {
            return NetworkResult.Error(code = null, message = validationResult.message)
        }
        
        // Proceed with submission if validation passes
        return safeApiCall {
            api.submitTeamEntry(contestId, teamId, request)
        }
    }
    
    override suspend fun getTeam(teamId: String): NetworkResult<TeamDto> {
        return safeApiCall {
            api.getTeam(teamId)
        }
    }
    
    override suspend fun getMyTeams(): NetworkResult<List<TeamDto>> {
        return safeApiCall {
            api.getMyTeams()
        }
    }
    
    override suspend fun createTeam(request: CreateTeamRequest): NetworkResult<TeamDto> {
        return safeApiCall {
            api.createTeam(request)
        }
    }
    
    override suspend fun listTeamContests(cursor: String?, limit: Int): NetworkResult<TeamContestListResponse> {
        return safeApiCall {
            api.listTeamContests(cursor, limit)
        }
    }
    
    override suspend fun getTeamSubmissions(
        contestId: String,
        cursor: String?,
        limit: Int
    ): NetworkResult<List<TeamSubmissionDto>> {
        return safeApiCall {
            api.getTeamSubmissions(contestId, cursor, limit)
        }
    }
}
