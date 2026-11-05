package com.runinga.feature.contests.domain.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.contests.data.remote.dto.*
import com.runinga.feature.contests.domain.model.Contest

/**
 * Repository interface for team-related operations.
 * Task 14.1: Update Teams Module to handle contest participation types
 */
interface TeamsRepository {
    
    /**
     * Registers a team for a contest with validation.
     * 
     * Validates:
     * - Contest participation type allows team registration
     * - Team size matches contest requirements
     * - Max teams limit not exceeded
     * 
     * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
     * 
     * @param contestId The ID of the contest
     * @param teamId The ID of the team
     * @param contest The contest details for validation
     * @param team The team details for validation
     * @return NetworkResult indicating success or failure
     */
    suspend fun registerTeamForContest(
        contestId: String,
        teamId: String,
        contest: Contest,
        team: TeamDto
    ): NetworkResult<Unit>
    
    /**
     * Submits a team entry for a contest with validation.
     * 
     * Validates:
     * - Contest participation type allows team submissions
     * 
     * Requirements: 16.1, 16.2, 16.3, 16.4
     * 
     * @param contestId The ID of the contest
     * @param teamId The ID of the team
     * @param request The submission request
     * @param contest The contest details for validation
     * @return NetworkResult indicating success or failure
     */
    suspend fun submitTeamEntry(
        contestId: String,
        teamId: String,
        request: SubmitTeamEntryRequest,
        contest: Contest
    ): NetworkResult<Unit>
    
    /**
     * Gets a team by ID.
     * 
     * @param teamId The ID of the team
     * @return NetworkResult with team details
     */
    suspend fun getTeam(teamId: String): NetworkResult<TeamDto>
    
    /**
     * Gets all teams for the current user.
     * 
     * @return NetworkResult with list of teams
     */
    suspend fun getMyTeams(): NetworkResult<List<TeamDto>>
    
    /**
     * Creates a new team.
     * 
     * @param request The team creation request
     * @return NetworkResult with created team
     */
    suspend fun createTeam(request: CreateTeamRequest): NetworkResult<TeamDto>
    
    /**
     * Lists contests available for team participation.
     * 
     * @param cursor Pagination cursor
     * @param limit Number of items per page
     * @return NetworkResult with team contest list
     */
    suspend fun listTeamContests(cursor: String?, limit: Int = 20): NetworkResult<TeamContestListResponse>
    
    /**
     * Gets team submissions for a contest.
     * 
     * @param contestId The ID of the contest
     * @param cursor Pagination cursor
     * @param limit Number of items per page
     * @return NetworkResult with list of team submissions
     */
    suspend fun getTeamSubmissions(
        contestId: String,
        cursor: String?,
        limit: Int = 20
    ): NetworkResult<List<TeamSubmissionDto>>
}
