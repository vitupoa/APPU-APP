package com.krieta.feature.contests.domain.validation

import com.krieta.feature.contests.data.remote.dto.TeamDto
import com.krieta.feature.contests.data.remote.dto.TeamMemberDto
import com.krieta.feature.contests.domain.model.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Unit tests for TeamParticipationValidator.
 * Tests Requirements 16.1-16.6 from the Contest Creation Wizard spec.
 * 
 * Task 14.1: Update Teams Module to handle contest participation types
 */
class TeamParticipationValidatorTest {
    
    // Helper function to create a test contest
    private fun createTestContest(
        participationType: ParticipationType = ParticipationType.INDIVIDUAL_ONLY,
        teamSize: Int? = null,
        maxTeams: Int? = null,
        registeredTeamsCount: Int = 0
    ): Contest {
        return Contest(
            id = "test-contest-1",
            creator = ContestCreator("creator-1", "creator", "Creator", null),
            title = "Test Contest",
            description = "Test Description",
            mediaType = ContestMediaType.PHOTO,
            contestCategory = ContestCategory.CHALLENGE,
            prizeKr = 1000.0,
            platformFeeKr = 50.0,
            totalChargedKr = 1050.0,
            rules = emptyList(),
            requiredActions = emptyList(),
            maxWinners = 1,
            judgingCriteria = JudgingCriteria.CREATOR_PICKS,
            sponsorName = null,
            sponsorUrl = null,
            deadline = "2024-12-31T23:59:59Z",
            coverMediaUrl = null,
            status = ContestStatus.ACTIVE,
            participantsCount = 0,
            submissionsCount = 0,
            isJoined = false,
            createdAt = "2024-01-01T00:00:00Z",
            participationType = participationType,
            teamSize = teamSize,
            maxTeams = maxTeams,
            registeredTeamsCount = registeredTeamsCount
        )
    }
    
    // Helper function to create a test team
    private fun createTestTeam(memberCount: Int): TeamDto {
        val members = (1..memberCount).map { i ->
            TeamMemberDto(
                id = "member-$i",
                userId = "user-$i",
                username = "user$i",
                displayName = "User $i",
                avatarUrl = null,
                role = if (i == 1) "LEADER" else "MEMBER",
                joinedAt = "2024-01-01T00:00:00Z",
                isOnline = false
            )
        }
        
        return TeamDto(
            id = "team-1",
            name = "Test Team",
            avatarUrl = null,
            leaderId = "user-1",
            members = members,
            maxMembers = 10,
            totalWins = 0,
            totalPrizes = 0.0,
            createdAt = "2024-01-01T00:00:00Z"
        )
    }
    
    // Requirement 16.4: Prevent team registration for INDIVIDUAL_ONLY contests
    @Test
    fun testTeamRegistration_IndividualOnly_ShouldFail() {
        val contest = createTestContest(participationType = ParticipationType.INDIVIDUAL_ONLY)
        val team = createTestTeam(memberCount = 3)
        
        val result = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        assertTrue(result is ValidationResult.Error)
        assertEquals(
            "This contest is for individual participants only. Team registration is not allowed.",
            (result as ValidationResult.Error).message
        )
    }
    
    // Requirement 16.1: Allow team registration for TEAM_ONLY contests
    @Test
    fun testTeamRegistration_TeamOnly_ShouldSucceed() {
        val contest = createTestContest(participationType = ParticipationType.TEAM_ONLY)
        val team = createTestTeam(memberCount = 3)
        
        val result = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Requirement 16.3: Allow team registration for BOTH contests
    @Test
    fun testTeamRegistration_Both_ShouldSucceed() {
        val contest = createTestContest(participationType = ParticipationType.BOTH)
        val team = createTestTeam(memberCount = 3)
        
        val result = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Requirement 16.5: Validate team size matches contest requirement
    @Test
    fun testTeamRegistration_TeamSizeMatches_ShouldSucceed() {
        val contest = createTestContest(
            participationType = ParticipationType.TEAM_ONLY,
            teamSize = 3
        )
        val team = createTestTeam(memberCount = 3)
        
        val result = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Requirement 16.5: Validate team size mismatch fails
    @Test
    fun testTeamRegistration_TeamSizeMismatch_ShouldFail() {
        val contest = createTestContest(
            participationType = ParticipationType.TEAM_ONLY,
            teamSize = 5
        )
        val team = createTestTeam(memberCount = 3)
        
        val result = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        assertTrue(result is ValidationResult.Error)
        assertEquals(
            "This contest requires teams of exactly 5 members. Your team has 3 members.",
            (result as ValidationResult.Error).message
        )
    }
    
    // Requirement 16.6: Prevent registration when max teams limit is reached
    @Test
    fun testTeamRegistration_MaxTeamsReached_ShouldFail() {
        val contest = createTestContest(
            participationType = ParticipationType.TEAM_ONLY,
            maxTeams = 10,
            registeredTeamsCount = 10
        )
        val team = createTestTeam(memberCount = 3)
        
        val result = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        assertTrue(result is ValidationResult.Error)
        assertEquals(
            "This contest has reached its maximum team limit of 10 teams.",
            (result as ValidationResult.Error).message
        )
    }
    
    // Requirement 16.6: Allow registration when below max teams limit
    @Test
    fun testTeamRegistration_BelowMaxTeams_ShouldSucceed() {
        val contest = createTestContest(
            participationType = ParticipationType.TEAM_ONLY,
            maxTeams = 10,
            registeredTeamsCount = 5
        )
        val team = createTestTeam(memberCount = 3)
        
        val result = TeamParticipationValidator.validateTeamRegistration(contest, team)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Requirement 16.2: Prevent individual registration for TEAM_ONLY contests
    @Test
    fun testIndividualRegistration_TeamOnly_ShouldFail() {
        val contest = createTestContest(participationType = ParticipationType.TEAM_ONLY)
        
        val result = TeamParticipationValidator.validateIndividualRegistration(contest)
        
        assertTrue(result is ValidationResult.Error)
        assertEquals(
            "This contest is for teams only. Individual registration is not allowed.",
            (result as ValidationResult.Error).message
        )
    }
    
    // Requirement 16.1: Allow individual registration for INDIVIDUAL_ONLY contests
    @Test
    fun testIndividualRegistration_IndividualOnly_ShouldSucceed() {
        val contest = createTestContest(participationType = ParticipationType.INDIVIDUAL_ONLY)
        
        val result = TeamParticipationValidator.validateIndividualRegistration(contest)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Requirement 16.3: Allow individual registration for BOTH contests
    @Test
    fun testIndividualRegistration_Both_ShouldSucceed() {
        val contest = createTestContest(participationType = ParticipationType.BOTH)
        
        val result = TeamParticipationValidator.validateIndividualRegistration(contest)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Test team submission validation for INDIVIDUAL_ONLY
    @Test
    fun testTeamSubmission_IndividualOnly_ShouldFail() {
        val contest = createTestContest(participationType = ParticipationType.INDIVIDUAL_ONLY)
        
        val result = TeamParticipationValidator.validateTeamSubmission(contest)
        
        assertTrue(result is ValidationResult.Error)
        assertEquals(
            "This contest is for individual participants only. Team submissions are not allowed.",
            (result as ValidationResult.Error).message
        )
    }
    
    // Test team submission validation for TEAM_ONLY
    @Test
    fun testTeamSubmission_TeamOnly_ShouldSucceed() {
        val contest = createTestContest(participationType = ParticipationType.TEAM_ONLY)
        
        val result = TeamParticipationValidator.validateTeamSubmission(contest)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Test team submission validation for BOTH
    @Test
    fun testTeamSubmission_Both_ShouldSucceed() {
        val contest = createTestContest(participationType = ParticipationType.BOTH)
        
        val result = TeamParticipationValidator.validateTeamSubmission(contest)
        
        assertTrue(result is ValidationResult.Success)
    }
    
    // Test helper methods
    @Test
    fun testIsTeamRegistrationAllowed() {
        val individualOnly = createTestContest(participationType = ParticipationType.INDIVIDUAL_ONLY)
        val teamOnly = createTestContest(participationType = ParticipationType.TEAM_ONLY)
        val both = createTestContest(participationType = ParticipationType.BOTH)
        
        assertEquals(false, TeamParticipationValidator.isTeamRegistrationAllowed(individualOnly))
        assertEquals(true, TeamParticipationValidator.isTeamRegistrationAllowed(teamOnly))
        assertEquals(true, TeamParticipationValidator.isTeamRegistrationAllowed(both))
    }
    
    @Test
    fun testIsIndividualRegistrationAllowed() {
        val individualOnly = createTestContest(participationType = ParticipationType.INDIVIDUAL_ONLY)
        val teamOnly = createTestContest(participationType = ParticipationType.TEAM_ONLY)
        val both = createTestContest(participationType = ParticipationType.BOTH)
        
        assertEquals(true, TeamParticipationValidator.isIndividualRegistrationAllowed(individualOnly))
        assertEquals(false, TeamParticipationValidator.isIndividualRegistrationAllowed(teamOnly))
        assertEquals(true, TeamParticipationValidator.isIndividualRegistrationAllowed(both))
    }
}
