package com.krieta.feature.contests.domain.validation

import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.model.ParticipationType
import com.krieta.feature.contests.data.remote.dto.TeamDto

/**
 * Validator for team participation in contests.
 * Implements Requirements 16.1-16.6 from the Contest Creation Wizard spec.
 * 
 * Task 14.1: Update Teams Module to handle contest participation types
 */
object TeamParticipationValidator {
    
    /**
     * Validates if a team can register for a contest.
     * 
     * Requirements:
     * - 16.1: When participationType is TEAM_ONLY, allow team registration
     * - 16.2: When participationType is TEAM_ONLY, prevent individual registration
     * - 16.3: When participationType is BOTH, allow both team and individual registration
     * - 16.4: When participationType is INDIVIDUAL_ONLY, prevent team registration
     * - 16.5: When contest has teamSize requirement, validate team has exactly that many members
     * - 16.6: When contest has maxTeams limit, prevent registration when limit is reached
     * 
     * @param contest The contest to validate against
     * @param team The team attempting to register
     * @return ValidationResult indicating success or failure with error message
     */
    fun validateTeamRegistration(contest: Contest, team: TeamDto): ValidationResult {
        // Requirement 16.4: Prevent team registration for INDIVIDUAL_ONLY contests
        if (contest.participationType == ParticipationType.INDIVIDUAL_ONLY) {
            return ValidationResult.Error("This contest is for individual participants only. Team registration is not allowed.")
        }
        
        // Requirements 16.1, 16.3: Allow team registration for TEAM_ONLY and BOTH
        if (contest.participationType != ParticipationType.TEAM_ONLY && 
            contest.participationType != ParticipationType.BOTH) {
            return ValidationResult.Error("Team registration is not allowed for this contest.")
        }
        
        // Requirement 16.5: Validate team size matches contest requirement
        contest.teamSize?.let { requiredSize ->
            val actualSize = team.members.size
            if (actualSize != requiredSize) {
                return ValidationResult.Error(
                    "This contest requires teams of exactly $requiredSize members. Your team has $actualSize members."
                )
            }
        }
        
        // Requirement 16.6: Validate max teams limit not exceeded
        contest.maxTeams?.let { maxTeams ->
            if (contest.registeredTeamsCount >= maxTeams) {
                return ValidationResult.Error(
                    "This contest has reached its maximum team limit of $maxTeams teams."
                )
            }
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates if an individual can register for a contest.
     * 
     * Requirements:
     * - 16.2: When participationType is TEAM_ONLY, prevent individual registration
     * - 16.3: When participationType is BOTH, allow both team and individual registration
     * - 16.1: When participationType is INDIVIDUAL_ONLY, allow individual registration
     * 
     * @param contest The contest to validate against
     * @return ValidationResult indicating success or failure with error message
     */
    fun validateIndividualRegistration(contest: Contest): ValidationResult {
        // Requirement 16.2: Prevent individual registration for TEAM_ONLY contests
        if (contest.participationType == ParticipationType.TEAM_ONLY) {
            return ValidationResult.Error("This contest is for teams only. Individual registration is not allowed.")
        }
        
        // Requirements 16.1, 16.3: Allow individual registration for INDIVIDUAL_ONLY and BOTH
        return ValidationResult.Success
    }
    
    /**
     * Validates if a team can submit an entry for a contest.
     * This checks if the team is allowed to participate based on contest configuration.
     * 
     * @param contest The contest to validate against
     * @return ValidationResult indicating success or failure with error message
     */
    fun validateTeamSubmission(contest: Contest): ValidationResult {
        // Requirement 16.4: Prevent team submission for INDIVIDUAL_ONLY contests
        if (contest.participationType == ParticipationType.INDIVIDUAL_ONLY) {
            return ValidationResult.Error("This contest is for individual participants only. Team submissions are not allowed.")
        }
        
        // Requirements 16.1, 16.3: Allow team submission for TEAM_ONLY and BOTH
        return ValidationResult.Success
    }
    
    /**
     * Checks if team registration is allowed for a contest.
     * This is a simple boolean check without detailed error messages.
     * 
     * @param contest The contest to check
     * @return true if team registration is allowed, false otherwise
     */
    fun isTeamRegistrationAllowed(contest: Contest): Boolean {
        return contest.participationType == ParticipationType.TEAM_ONLY ||
               contest.participationType == ParticipationType.BOTH
    }
    
    /**
     * Checks if individual registration is allowed for a contest.
     * This is a simple boolean check without detailed error messages.
     * 
     * @param contest The contest to check
     * @return true if individual registration is allowed, false otherwise
     */
    fun isIndividualRegistrationAllowed(contest: Contest): Boolean {
        return contest.participationType == ParticipationType.INDIVIDUAL_ONLY ||
               contest.participationType == ParticipationType.BOTH
    }
}

/**
 * Result of a validation operation.
 */
sealed class ValidationResult {
    object Success : ValidationResult()
    data class Error(val message: String) : ValidationResult()
    
    val isSuccess: Boolean
        get() = this is Success
    
    val isError: Boolean
        get() = this is Error
    
    fun getErrorMessage(): String? {
        return when (this) {
            is Error -> message
            is Success -> null
        }
    }
}
