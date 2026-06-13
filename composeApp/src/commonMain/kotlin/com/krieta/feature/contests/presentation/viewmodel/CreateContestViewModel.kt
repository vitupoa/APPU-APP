package com.krieta.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.ApiConstants
import com.krieta.com.core.util.SafeConversion
import com.krieta.com.core.security.InputValidator
import com.krieta.feature.contests.data.remote.dto.CreateContestRequestDto
import com.krieta.feature.contests.data.remote.dto.PrizeDistributionDto
import com.krieta.feature.contests.data.remote.dto.RequiredActionDto
import com.krieta.feature.contests.domain.repository.ContestsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.Instant
import kotlinx.datetime.plus
import kotlin.time.ExperimentalTime
import com.krieta.com.core.util.formatString

// Enums for wizard configuration
enum class ParticipationType {
    INDIVIDUAL_ONLY,
    TEAM_ONLY,
    BOTH
}

enum class SelectionMethod {
    MANUAL,
    RANDOM,
    VOTING,
    COMBINATION
}

enum class TaskType {
    FOLLOW_KRIETA,
    SUBSCRIBE_YOUTUBE,
    FOLLOW_SPOTIFY,
    FOLLOW_INSTAGRAM,
    FOLLOW_TIKTOK,
    WATCH_VIDEO,
    VISIT_SHOP,
    CUSTOM_TASK
}

// Data class for task configuration
data class TaskConfiguration(
    val type: TaskType,
    val data: String, // Username, URL, or custom description depending on type
    val customName: String? = null, // Custom name for CUSTOM_TASK type
    val link: String? = null // Optional link for custom tasks
)

// Data class for judge information
data class Judge(
    val userId: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null
)

data class CreateContestState(
    // Wizard Navigation Fields (Subtask 2.1)
    val currentStep: Int = 1, // 1-5 for wizard navigation
    val stepValidation: Map<Int, Boolean> = mapOf(
        1 to false,
        2 to false,
        3 to false,
        4 to false,
        5 to false
    ),
    
    // Step 1: Contest Details and Dates (Subtask 2.2)
    val title: String = "",
    val description: String = "",
    val rules: String = "",
    val coverImageFile: io.github.vinceglb.filekit.core.PlatformFile? = null,
    val startDate: Instant? = null,
    val endDate: Instant? = null,
    val exampleContentUrl: String = "",
    
    // Step 2: Audience Demographics and Targeting (Subtask 2.3)
    val demographicsLock: Boolean = false,
    val minAge: Int? = null,
    val maxAge: Int? = null,
    val targetLocations: String = "",
    
    // Step 2: Team Participation Configuration (Subtask 2.3)
    val participationType: ParticipationType = ParticipationType.INDIVIDUAL_ONLY,
    val teamSize: Int? = null, // 2-10 members
    val maxTeams: Int? = null,
    
    // Step 2: Entry Fee Configuration (Subtask 2.3)
    val entryFee: Double = 0.0,
    
    // Step 3: Tasks and Connectors (Subtask 2.4)
    val taskType: TaskType = TaskType.FOLLOW_KRIETA,
    val taskConfiguration: String = "", // Current task being configured
    val customTaskName: String = "", // Custom task name for CUSTOM_TASK type
    val customTaskLink: String = "", // Optional link for custom tasks
    val addedTasks: List<TaskConfiguration> = emptyList(),
    
    // Step 4: Prize Distribution (Subtask 2.5)
    val winnerSlots: Int = 1, // 1-3
    val prizeAmounts: List<Double> = listOf(0.0), // 1st, 2nd, 3rd place prizes
    
    // Step 4: Selection Method (Subtask 2.5)
    val selectionMethod: SelectionMethod = SelectionMethod.MANUAL,
    val paidVoting: Boolean = false,
    val votingCostFiat: Double = 0.0,
    
    // Step 4: Milestone Airdrop (Subtask 2.5)
    val milestoneAirdropEnabled: Boolean = false,
    val milestoneAirdropAmount: Double = 0.0,
    val milestoneAirdropLimit: Int = 0,
    
    // Step 5: Judge Assignment (Subtask 2.6)
    val judges: List<Judge> = emptyList(),
    val judgeSearchQuery: String = "",
    val judgeSearchResults: List<com.krieta.feature.profile.domain.model.SocialUser> = emptyList(),
    val isSearchingJudges: Boolean = false,
    
    // Legacy fields (kept for backward compatibility)
    val prizeKr: String = "",
    val category: String = "CHALLENGE",
    val mediaType: String = "PHOTO_AND_VIDEO",
    
    // UI State
    val isPosting: Boolean = false,
    val isPublishing: Boolean = false, // Task 12.2: Loading state for contest publishing
    val success: Boolean = false,
    val error: String? = null
) {
    // Computed property: Duration calculation (Requirement 2.6, 2.7)
    val duration: kotlin.time.Duration?
        get() = try {
            if (startDate != null && endDate != null && endDate > startDate) {
                endDate - startDate
            } else null
        } catch (e: Exception) {
            null
        }
    
    // Computed property: Total prize pool (Requirement 7.6, 7.7)
    val totalPrizePool: Double
        get() = prizeAmounts.sum()
    
    // Validation function: Check if current step is valid (Subtask 2.1)
    fun isStepValid(step: Int): Boolean {
        return when (step) {
            1 -> validateStep1()
            2 -> validateStep2()
            3 -> validateStep3()
            4 -> validateStep4()
            5 -> validateStep5()
            else -> false
        }
    }
    
    // Step 1 validation (Requirements 2.1-2.10)
    private fun validateStep1(): Boolean {
        return try {
            val titleValid = title.length in 3..80
            val descriptionValid = description.length >= 10
            val datesValid = startDate != null && endDate != null
            val durationValid = if (startDate != null && endDate != null) {
                val dur = duration
                dur != null && dur.inWholeHours >= 2
            } else false
            
            titleValid && descriptionValid && datesValid && durationValid
        } catch (e: Exception) {
            // If any validation throws an exception, consider step invalid
            false
        }
    }
    
    // Step 2 validation (Requirements 3.1-5.4)
    private fun validateStep2(): Boolean {
        return try {
            val demographicsValid = if (demographicsLock) {
                val ageValid = minAge != null && maxAge != null && minAge <= maxAge
                ageValid
            } else true
            
            val teamConfigValid = when (participationType) {
                ParticipationType.TEAM_ONLY, ParticipationType.BOTH -> {
                    val teamSizeValid = teamSize == null || teamSize in 2..10
                    val maxTeamsValid = maxTeams == null || maxTeams > 0
                    teamSizeValid && maxTeamsValid
                }
                ParticipationType.INDIVIDUAL_ONLY -> true
            }
            
            val entryFeeValid = entryFee >= 0.0
            
            demographicsValid && teamConfigValid && entryFeeValid
        } catch (e: Exception) {
            false
        }
    }
    
    // Step 3 validation (Requirements 6.1-6.14)
    private fun validateStep3(): Boolean {
        return try {
            addedTasks.isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }
    
    // Step 4 validation (Requirements 7.1-10.5)
    private fun validateStep4(): Boolean {
        return try {
            val prizesValid = prizeAmounts.all { it >= 0.0 } && prizeAmounts.size == winnerSlots
            
            val airdropValid = if (milestoneAirdropEnabled) {
                milestoneAirdropAmount > 0.0 && milestoneAirdropLimit > 0
            } else true
            
            // Mutual exclusivity: entry fee and paid voting (Requirements 9.2, 9.3, 9.4)
            val mutualExclusivityValid = !(entryFee > 0.0 && paidVoting)
            
            prizesValid && airdropValid && mutualExclusivityValid
        } catch (e: Exception) {
            false
        }
    }
    
    // Step 5 validation (Requirements 11.1-12.9)
    private fun validateStep5(): Boolean {
        return try {
            val judgesValid = when (selectionMethod) {
                SelectionMethod.MANUAL, SelectionMethod.COMBINATION -> judges.isNotEmpty() && judges.size <= 15
                SelectionMethod.RANDOM, SelectionMethod.VOTING -> true
            }
            judgesValid
        } catch (e: Exception) {
            false
        }
    }
}

@OptIn(ExperimentalTime::class)
class CreateContestViewModel(
    private val repository: ContestsRepository,
    private val cloudinaryUploader: CloudinaryUploader,
    private val currencyProvider: com.krieta.com.core.location.UserCurrencyProvider,
    private val profileRepository: com.krieta.feature.profile.domain.repository.ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(CreateContestState())
    val state: StateFlow<CreateContestState> = _state.asStateFlow()

    // Wizard Navigation Functions (Subtask 3.1)
    // Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
    
    /**
     * Advances to the next step in the wizard if the current step is valid.
     * Validates the current step before proceeding and updates step validation state.
     * Requirements: 1.5, 1.8, 1.9
     */
    fun nextStep() {
        val currentState = _state.value
        
        // Clear any previous errors
        _state.value = currentState.copy(error = null)
        
        // Validate current step before proceeding (Requirement 1.8)
        if (!currentState.isStepValid(currentState.currentStep)) {
            // Show validation error
            _state.value = _state.value.copy(
                error = "Please complete all required fields before continuing"
            )
            return
        }
        
        // Proceed to next step if valid and not on last step
        if (currentState.currentStep < 5) {
            _state.value = currentState.copy(
                currentStep = currentState.currentStep + 1,
                stepValidation = currentState.stepValidation + (currentState.currentStep to true),
                error = null
            )
        }
    }
    
    /**
     * Returns to the previous step in the wizard with step bounds checking.
     * Requirements: 1.4, 1.5
     */
    fun previousStep() {
        val currentState = _state.value
        // Step bounds checking: only allow going back if not on step 1 (Requirement 1.4)
        if (currentState.currentStep > 1) {
            _state.value = currentState.copy(currentStep = currentState.currentStep - 1)
        }
    }
    
    /**
     * Checks if the current step has valid data.
     * Used to enable/disable the Continue or Publish button.
     * Requirements: 1.6, 1.7, 1.8
     */
    fun isCurrentStepValid(): Boolean {
        return _state.value.isStepValid(_state.value.currentStep)
    }
    
    /**
     * Validates a specific step by delegating to step-specific validation functions.
     * Requirements: 1.8, 1.9
     */
    fun isStepValid(step: Int): Boolean {
        return _state.value.isStepValid(step)
    }
    
    /**
     * Validates all steps in the wizard.
     * Used before final contest submission to ensure all data is valid.
     * Requirements: 1.9
     */
    fun validateAllSteps(): Boolean {
        return (1..5).all { step -> _state.value.isStepValid(step) }
    }
    
    // Real-Time Validation Functions (Subtask 3.2)
    // Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
    
    /**
     * Validates Step 1: Contest Details and Dates
     * Requirements: 2.1-2.10, 15.1, 15.2
     * @return Map of field names to error messages (empty if valid)
     */
    fun validateStep1(): Map<String, String> {
        val errors = mutableMapOf<String, String>()
        val currentState = _state.value
        
        // Title validation (Requirements 2.1, 2.9)
        when {
            currentState.title.isBlank() -> errors["title"] = "Title is required"
            currentState.title.length < 3 -> errors["title"] = "Title must be at least 3 characters"
            currentState.title.length > 80 -> errors["title"] = "Title must not exceed 80 characters"
        }
        
        // Description validation (Requirements 2.2, 2.10)
        when {
            currentState.description.isBlank() -> errors["description"] = "Description is required"
            currentState.description.length < 10 -> errors["description"] = "Description must be at least 10 characters"
        }
        
        // Date validation (Requirements 2.4, 2.5)
        if (currentState.startDate == null) {
            errors["startDate"] = "Start date is required"
        }
        if (currentState.endDate == null) {
            errors["endDate"] = "End date is required"
        }
        
        // Duration validation (Requirements 2.6, 2.7)
        if (currentState.startDate != null && currentState.endDate != null) {
            val duration = currentState.duration
            if (duration != null && duration.inWholeHours < 2) {
                errors["duration"] = "Contest duration must be at least 2 hours"
            }
            if (currentState.endDate <= currentState.startDate) {
                errors["endDate"] = "End date must be after start date"
            }
        }
        
        return errors
    }
    
    /**
     * Validates Step 2: Audience Demographics and Team Configuration
     * Requirements: 3.1-5.4, 15.1, 15.2
     * @return Map of field names to error messages (empty if valid)
     */
    fun validateStep2(): Map<String, String> {
        val errors = mutableMapOf<String, String>()
        
        try {
            val currentState = _state.value
            
            // Demographics validation (Requirements 3.1-3.5)
            if (currentState.demographicsLock) {
                if (currentState.minAge == null) {
                    errors["minAge"] = "Minimum age is required when demographics lock is enabled"
                }
                if (currentState.maxAge == null) {
                    errors["maxAge"] = "Maximum age is required when demographics lock is enabled"
                }
                if (currentState.minAge != null && currentState.maxAge != null && currentState.minAge > currentState.maxAge) {
                    errors["ageRange"] = "Minimum age must be less than or equal to maximum age"
                }
            }
            
            // Team configuration validation (Requirements 4.1-4.8)
            when (currentState.participationType) {
                ParticipationType.TEAM_ONLY, ParticipationType.BOTH -> {
                    currentState.teamSize?.let { teamSize ->
                        if (teamSize !in 2..10) {
                            errors["teamSize"] = "Team size must be between 2 and 10 members"
                        }
                    }
                    currentState.maxTeams?.let { maxTeams ->
                        if (maxTeams <= 0) {
                            errors["maxTeams"] = "Maximum teams must be a positive number"
                        }
                    }
                }
                ParticipationType.INDIVIDUAL_ONLY -> {
                    // No team configuration validation needed
                }
            }
            
            // Entry fee validation (Requirements 5.1-5.4)
            if (currentState.entryFee < 0.0) {
                errors["entryFee"] = "Entry fee cannot be negative"
            }
        } catch (e: Exception) {
            errors["validation"] = "Validation error: ${e.message}"
        }
        
        return errors
    }
    
    /**
     * Validates Step 3: Tasks and Connectors
     * Requirements: 6.1-6.14, 15.1, 15.2
     * @return Map of field names to error messages (empty if valid)
     */
    fun validateStep3(): Map<String, String> {
        val errors = mutableMapOf<String, String>()
        
        try {
            val currentState = _state.value
            
            // Task list validation (Requirements 6.10-6.14)
            if (currentState.addedTasks.isEmpty()) {
                errors["taskList"] = "At least one task is required"
            }
            
            // Current task configuration validation (Requirements 6.1-6.9)
            if (currentState.taskConfiguration.isNotBlank()) {
                when (currentState.taskType) {
                    TaskType.FOLLOW_KRIETA -> {
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "Krieta username is required"
                        }
                    }
                    TaskType.SUBSCRIBE_YOUTUBE -> {
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "YouTube channel URL is required"
                        }
                    }
                    TaskType.FOLLOW_SPOTIFY -> {
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "Spotify artist URL is required"
                        }
                    }
                    TaskType.FOLLOW_INSTAGRAM -> {
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "Instagram username is required"
                        }
                    }
                    TaskType.FOLLOW_TIKTOK -> {
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "TikTok username is required"
                        }
                    }
                    TaskType.WATCH_VIDEO -> {
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "Video URL is required"
                        }
                    }
                    TaskType.VISIT_SHOP -> {
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "Shop URL is required"
                        }
                    }
                    TaskType.CUSTOM_TASK -> {
                        if (currentState.customTaskName.isBlank()) {
                            errors["customTaskName"] = "Custom task label is required"
                        }
                        if (currentState.taskConfiguration.isBlank()) {
                            errors["taskConfiguration"] = "Link is required"
                        }
                    }
                }
            }
        } catch (e: Exception) {
            errors["validation"] = "Validation error: ${e.message}"
        }
        
        return errors
    }
    
    /**
     * Validates Step 4: Prize Distribution and Selection Method
     * Requirements: 7.1-10.5, 15.1, 15.2
     * @return Map of field names to error messages (empty if valid)
     */
    fun validateStep4(): Map<String, String> {
        val errors = mutableMapOf<String, String>()
        
        try {
            val currentState = _state.value
            
            // Prize distribution validation (Requirements 7.1-7.7)
            if (currentState.prizeAmounts.size != currentState.winnerSlots) {
                errors["prizeAmounts"] = "Prize amounts must match winner slots"
            }
            
            currentState.prizeAmounts.forEachIndexed { index, amount ->
                if (amount < 0.0) {
                    errors["prizeAmount_$index"] = "Prize amount cannot be negative"
                }
            }
            
            if (currentState.totalPrizePool <= 0.0) {
                errors["totalPrizePool"] = "Total prize pool must be greater than zero"
            }
            
            // Milestone airdrop validation (Requirements 10.1-10.5)
            if (currentState.milestoneAirdropEnabled) {
                if (currentState.milestoneAirdropAmount <= 0.0) {
                    errors["milestoneAirdropAmount"] = "Airdrop amount must be positive"
                }
                if (currentState.milestoneAirdropLimit <= 0) {
                    errors["milestoneAirdropLimit"] = "Airdrop participant limit must be positive"
                }
            }
            
            // Mutual exclusivity validation (Requirements 9.2, 9.3, 9.4)
            if (currentState.entryFee > 0.0 && currentState.paidVoting) {
                errors["mutualExclusivity"] = "Entry fee and paid voting are mutually exclusive"
            }
            
            // Paid voting cost validation
            if (currentState.paidVoting && currentState.votingCostFiat <= 0.0) {
                errors["votingCost"] = "Voting cost must be greater than zero when paid voting is enabled"
            }
        } catch (e: Exception) {
            errors["validation"] = "Validation error: ${e.message}"
        }
        
        return errors
    }
    
    /**
     * Validates Step 5: Judge Assignment and Final Review
     * Requirements: 11.1-12.9, 15.1, 15.2
     * @return Map of field names to error messages (empty if valid)
     */
    fun validateStep5(): Map<String, String> {
        val errors = mutableMapOf<String, String>()
        
        try {
            val currentState = _state.value
            
            // Judge assignment validation (Requirements 11.1-11.7)
            when (currentState.selectionMethod) {
                SelectionMethod.MANUAL, SelectionMethod.COMBINATION -> {
                    if (currentState.judges.isEmpty()) {
                        errors["judges"] = "At least one judge is required for manual or combination selection"
                    }
                    if (currentState.judges.size > 15) {
                        errors["judges"] = "Maximum 15 judges allowed"
                    }
                }
                SelectionMethod.RANDOM, SelectionMethod.VOTING -> {
                    // No judge validation needed for these methods
                }
            }
        } catch (e: Exception) {
            errors["validation"] = "Validation error: ${e.message}"
        }
        
        return errors
    }
    
    // Kr Conversion Utility Functions (Subtask 3.3)
    // Requirements: 5.2, 5.3, 7.5, 7.6
    
    /**
     * Converts a local currency amount to Kr using the current exchange rate.
     * Applies platform margin for buy transactions (user gets less Kr).
     * Requirements: 5.2, 7.5
     * @param fiatAmount The amount in local currency
     * @param applyMargin Whether to apply the 4.5% platform margin (default: true)
     * @return The equivalent Kr amount
     */
    fun convertToKr(fiatAmount: Double, applyMargin: Boolean = true): Double {
        val rate = currencyProvider.exchangeRate.value?.baseRate ?: 0.0
        return com.krieta.com.core.util.KrCurrencyFormatter.fiatToKr(fiatAmount, rate, applyMargin)
    }
    
    /**
     * Converts a Kr amount to local currency using the current exchange rate.
     * Applies platform margin for sell transactions (user gets less fiat).
     * Requirements: 5.2, 7.5
     * @param krAmount The amount in Kr
     * @param applyMargin Whether to apply the 4.5% platform margin (default: true)
     * @return The equivalent local currency amount
     */
    fun convertToFiat(krAmount: Double, applyMargin: Boolean = true): Double {
        val rate = currencyProvider.exchangeRate.value?.baseRate ?: 0.0
        return com.krieta.com.core.util.KrCurrencyFormatter.krToFiat(krAmount, rate, applyMargin)
    }
    
    /**
     * Formats a Kr amount with fiat equivalent for display.
     * Example: "Kr.500 (~KES 850)"
     * Requirements: 5.2, 5.3, 7.5, 7.6
     * @param krAmount The amount in Kr
     * @return Formatted string with Kr and fiat equivalent
     */
    fun formatKrWithFiat(krAmount: Double): String {
        return currencyProvider.formatWithFiat(krAmount)
    }
    
    /**
     * Formats a fiat amount with currency code.
     * Example: "KES 850"
     * Requirements: 5.2, 5.3
     * @param fiatAmount The amount in local currency
     * @return Formatted string with currency code and amount
     */
    fun formatFiat(fiatAmount: Double): String {
        val currencyCode = currencyProvider.currencyCode
        return com.krieta.com.core.util.KrCurrencyFormatter.formatFiat(fiatAmount, currencyCode)
    }
    
    /**
     * Formats a Kr amount.
     * Example: "Kr.500"
     * Requirements: 5.2, 7.5
     * @param krAmount The amount in Kr
     * @return Formatted Kr string
     */
    fun formatKr(krAmount: Double): String {
        return com.krieta.com.core.util.KrCurrencyFormatter.formatKr(krAmount)
    }
    
    /**
     * Gets the current currency code for the user's location.
     * Requirements: 5.2, 5.3
     * @return Currency code (e.g., "KES", "USD")
     */
    fun getCurrencyCode(): String {
        return currencyProvider.currencyCode
    }
    
    /**
     * Gets the current exchange rate.
     * Requirements: 5.2, 7.5
     * @return Exchange rate or null if not loaded
     */
    fun getExchangeRate(): Double? {
        return currencyProvider.exchangeRate.value?.baseRate
    }
    
    /**
     * Real-time conversion display for entry fees.
     * Converts the current entry fee to Kr and returns formatted string.
     * Requirements: 5.2, 5.3
     * @return Formatted string showing Kr equivalent of entry fee
     */
    fun getEntryFeeKrDisplay(): String {
        val currentState = _state.value
        if (currentState.entryFee <= 0.0) return "Kr.0"
        val krAmount = convertToKr(currentState.entryFee, applyMargin = false)
        return formatKr(krAmount)
    }
    
    /**
     * Real-time conversion display for prize amounts.
     * Converts a prize amount to Kr and returns formatted string.
     * Requirements: 7.5, 7.6
     * @param prizeAmount The prize amount in local currency
     * @return Formatted string showing Kr equivalent
     */
    fun getPrizeKrDisplay(prizeAmount: Double): String {
        if (prizeAmount <= 0.0) return "Kr.0"
        val krAmount = convertToKr(prizeAmount, applyMargin = false)
        return formatKr(krAmount)
    }
    
    /**
     * Real-time conversion display for total prize pool.
     * Converts the total prize pool to Kr and returns formatted string.
     * Requirements: 7.5, 7.6
     * @return Formatted string showing Kr equivalent of total prize pool
     */
    fun getTotalPrizePoolKrDisplay(): String {
        val currentState = _state.value
        val totalFiat = currentState.totalPrizePool
        if (totalFiat <= 0.0) return "Kr.0"
        val krAmount = convertToKr(totalFiat, applyMargin = false)
        return formatKr(krAmount)
    }
    
    /**
     * Real-time conversion display for milestone airdrop amount.
     * Converts the airdrop amount to Kr and returns formatted string.
     * Requirements: 10.3
     * @return Formatted string showing Kr equivalent of airdrop amount
     */
    fun getAirdropKrDisplay(): String {
        val currentState = _state.value
        if (currentState.milestoneAirdropAmount <= 0.0) return "Kr.0"
        val krAmount = convertToKr(currentState.milestoneAirdropAmount, applyMargin = false)
        return formatKr(krAmount)
    }
    
    /**
     * Real-time conversion display for voting cost.
     * Converts the voting cost from fiat to Kr and returns formatted string.
     * @return Formatted string showing Kr equivalent of voting cost
     */
    fun getVotingCostKrDisplay(): String {
        val currentState = _state.value
        if (currentState.votingCostFiat <= 0.0) return "Kr.0"
        val krAmount = convertToKr(currentState.votingCostFiat, applyMargin = false)
        return formatKr(krAmount)
    }
    
    /**
     * Formats voting cost with Kr and fiat for end user display.
     * Shows Kr amount prominently with fiat equivalent below/next to it.
     * @return Formatted string for end user display
     */
    fun getVotingCostUserDisplay(): String {
        val currentState = _state.value
        if (currentState.votingCostFiat <= 0.0) return "Free"
        val krAmount = convertToKr(currentState.votingCostFiat, applyMargin = false)
        val currencyCode = getCurrencyCode()
        return "${formatKr(krAmount)} (~$currencyCode ${formatString("%.2f", currentState.votingCostFiat)})"
    }
    
    // Step 1: Contest Details and Dates Update Functions (Subtask 2.2)
    fun updateTitle(v: String) { 
        try {
            val validated = InputValidator.validateText(v, "title")
            _state.value = _state.value.copy(title = validated)
        } catch (e: SecurityException) {
            _state.value = _state.value.copy(error = e.message)
        }
    }
    fun updateDescription(v: String) { 
        try {
            val validated = InputValidator.validateText(v, "description")
            _state.value = _state.value.copy(description = validated)
        } catch (e: SecurityException) {
            _state.value = _state.value.copy(error = e.message)
        }
    }
    fun updateRules(v: String) { 
        try {
            val validated = InputValidator.validateText(v, "rules")
            _state.value = _state.value.copy(rules = validated)
        } catch (e: SecurityException) {
            _state.value = _state.value.copy(error = e.message)
        }
    }
    fun setCoverImage(file: io.github.vinceglb.filekit.core.PlatformFile?) { _state.value = _state.value.copy(coverImageFile = file) }
    fun updateStartDate(v: Instant?) { _state.value = _state.value.copy(startDate = v) }
    fun updateEndDate(v: Instant?) { _state.value = _state.value.copy(endDate = v) }
    fun updateExampleContentUrl(v: String) { 
        try {
            if (v.isNotBlank()) {
                val validated = InputValidator.validateUrl(v)
                _state.value = _state.value.copy(exampleContentUrl = validated)
            } else {
                _state.value = _state.value.copy(exampleContentUrl = v)
            }
        } catch (e: SecurityException) {
            _state.value = _state.value.copy(error = e.message)
        }
    }
    
    // Step 2: Audience Demographics Update Functions (Subtask 2.3)
    fun updateDemographicsLock(v: Boolean) { _state.value = _state.value.copy(demographicsLock = v) }
    fun updateMinAge(v: Int?) { _state.value = _state.value.copy(minAge = v) }
    fun updateMaxAge(v: Int?) { _state.value = _state.value.copy(maxAge = v) }
    fun updateTargetLocations(v: String) { _state.value = _state.value.copy(targetLocations = v) }
    
    // Step 2: Team Participation Update Functions (Subtask 2.3)
    fun updateParticipationType(v: ParticipationType) { _state.value = _state.value.copy(participationType = v) }
    fun updateTeamSize(v: Int?) { _state.value = _state.value.copy(teamSize = v) }
    fun updateMaxTeams(v: Int?) { _state.value = _state.value.copy(maxTeams = v) }
    
    // Step 2: Entry Fee Update Functions (Subtask 2.3)
    fun updateEntryFee(v: Double) { _state.value = _state.value.copy(entryFee = v) }
    
    // Step 3: Tasks Update Functions (Subtask 2.4)
    fun updateTaskType(v: TaskType) { _state.value = _state.value.copy(taskType = v) }
    fun updateTaskConfiguration(v: String) { 
        // Allow typing without validation - validation happens on add
        _state.value = _state.value.copy(taskConfiguration = v)
    }
    fun updateCustomTaskName(v: String) { 
        try {
            val validated = InputValidator.validateText(v, "task name")
            _state.value = _state.value.copy(customTaskName = validated)
        } catch (e: SecurityException) {
            _state.value = _state.value.copy(error = e.message)
        }
    }
    fun updateCustomTaskLink(v: String) { 
        // Allow typing without validation - validation happens on add
        _state.value = _state.value.copy(customTaskLink = v)
    }
    
    fun addTask() {
        val currentState = _state.value
        if (currentState.taskConfiguration.isNotBlank()) {
            val newTask = TaskConfiguration(
                type = currentState.taskType,
                data = currentState.taskConfiguration,
                customName = if (currentState.taskType == TaskType.CUSTOM_TASK) currentState.customTaskName.ifBlank { null } else null,
                link = null
            )
            _state.value = currentState.copy(
                addedTasks = currentState.addedTasks + newTask,
                taskConfiguration = "",
                customTaskName = "",
                customTaskLink = ""
            )
        }
    }
    
    fun removeTask(task: TaskConfiguration) {
        val currentState = _state.value
        _state.value = currentState.copy(addedTasks = currentState.addedTasks - task)
    }
    
    // Step 4: Prize Distribution Update Functions (Subtask 2.5)
    fun updateWinnerSlots(v: Int) {
        val currentState = _state.value
        val newPrizeAmounts = when {
            v > currentState.prizeAmounts.size -> currentState.prizeAmounts + List(v - currentState.prizeAmounts.size) { 0.0 }
            v < currentState.prizeAmounts.size -> currentState.prizeAmounts.take(v)
            else -> currentState.prizeAmounts
        }
        _state.value = currentState.copy(winnerSlots = v, prizeAmounts = newPrizeAmounts)
    }
    
    fun updatePrizeAmount(index: Int, amount: Double) {
        val currentState = _state.value
        if (index in currentState.prizeAmounts.indices) {
            val newPrizeAmounts = currentState.prizeAmounts.toMutableList()
            newPrizeAmounts[index] = amount
            _state.value = currentState.copy(prizeAmounts = newPrizeAmounts)
        }
    }
    
    // Step 4: Selection Method Update Functions (Subtask 2.5)
    fun updateSelectionMethod(v: SelectionMethod) { _state.value = _state.value.copy(selectionMethod = v) }
    fun updatePaidVoting(v: Boolean) { _state.value = _state.value.copy(paidVoting = v) }
    fun updateVotingCostFiat(v: Double) { _state.value = _state.value.copy(votingCostFiat = v) }
    
    // Step 4: Milestone Airdrop Update Functions (Subtask 2.5)
    fun updateMilestoneAirdropEnabled(v: Boolean) { _state.value = _state.value.copy(milestoneAirdropEnabled = v) }
    fun updateMilestoneAirdropAmount(v: Double) { _state.value = _state.value.copy(milestoneAirdropAmount = v) }
    fun updateMilestoneAirdropLimit(v: Int) { _state.value = _state.value.copy(milestoneAirdropLimit = v) }
    
    // Step 5: Judge Assignment Update Functions (Subtask 2.6)
    private var searchJob: kotlinx.coroutines.Job? = null
    
    fun updateJudgeSearchQuery(v: String) { 
        _state.value = _state.value.copy(judgeSearchQuery = v)
        
        // Cancel previous search job
        searchJob?.cancel()
        
        // Perform debounced search when query is at least 2 characters
        if (v.length >= 2) {
            searchJob = screenModelScope.launch {
                // Debounce: wait 500ms before searching
                kotlinx.coroutines.delay(500)
                searchJudges(v)
            }
        } else {
            _state.value = _state.value.copy(judgeSearchResults = emptyList(), isSearchingJudges = false)
        }
    }
    
    /**
     * Search for users to add as judges
     * Performs debounced search to reduce API load
     */
    private suspend fun searchJudges(query: String) {
        _state.value = _state.value.copy(isSearchingJudges = true)
        
        when (val result = profileRepository.searchUsers(query)) {
            is NetworkResult.Success -> {
                // Filter out users who are already judges
                val currentJudgeIds = _state.value.judges.map { it.userId }
                val filteredResults = result.data.filter { it.id !in currentJudgeIds }
                
                _state.value = _state.value.copy(
                    judgeSearchResults = filteredResults,
                    isSearchingJudges = false
                )
            }
            is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                _state.value = _state.value.copy(
                    judgeSearchResults = emptyList(),
                    isSearchingJudges = false
                )
            }
        }
    }
    
    fun addJudge(judge: Judge) {
        val currentState = _state.value
        if (currentState.judges.size < 15 && !currentState.judges.any { it.userId == judge.userId }) {
            _state.value = currentState.copy(
                judges = currentState.judges + judge,
                judgeSearchQuery = "", // Clear search after adding
                judgeSearchResults = emptyList() // Clear results after adding
            )
        }
    }
    
    fun addJudgeFromSearchResult(user: com.krieta.feature.profile.domain.model.SocialUser) {
        val judge = Judge(
            userId = user.id,
            username = user.username,
            displayName = user.displayName,
            avatarUrl = user.avatarUrl
        )
        addJudge(judge)
    }
    
    fun removeJudge(judge: Judge) {
        val currentState = _state.value
        _state.value = currentState.copy(judges = currentState.judges - judge)
    }
    
    /**
     * Clears the error message from the state.
     * Used when the user dismisses the error message card.
     * Task 12.2: Error handling (Requirement 13.7)
     */
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
    
    // Legacy update functions (kept for backward compatibility)
    fun updatePrizeKr(v: String) { _state.value = _state.value.copy(prizeKr = v) }
    fun updateCategory(v: String) { _state.value = _state.value.copy(category = v) }

    fun post() {
        val currentState = _state.value
        val prize = SafeConversion.toDoubleOrDefaultWithValidation(
            value = currentState.prizeKr,
            fieldName = "contestPrize",
            min = 0.0,
            defaultValue = 0.0
        )
        
        if (currentState.title.isBlank() || currentState.description.isBlank() || (prize ?: 0.0) <= 0) {
            _state.value = currentState.copy(error = "Please fill all required fields correctly")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            if (currentState.coverImageFile != null) {
                val filePath = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(currentState.coverImageFile)
                com.krieta.com.core.upload.BackgroundUploader.enqueueUpload(
                    type = com.krieta.com.core.upload.UploadType.CONTEST,
                    filePath = filePath,
                    caption = currentState.title,
                    additionalData = mapOf(
                        "PRIZE" to prize.toString()
                    )
                )
            }
            
            _state.value = _state.value.copy(isPosting = false, success = true)
        }
    }
    
    // Task 12: Backend Integration and Contest Publishing
    // Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9
    
    /**
     * Publishes the contest by constructing a comprehensive payload from all wizard steps
     * and submitting it to the backend API.
     * 
     * Task 12.1: Comprehensive payload construction from all wizard steps
     * - Includes participationType, teamSize, maxTeams fields
     * - Includes all wizard-configured fields
     * - Validates all steps before submission
     * 
     * Task 12.2: Contest submission and response handling
     * - Manages loading state during submission
     * - Handles success response with wizard closure signal
     * - Handles error response with error display
     * - Manages button state during submission
     * 
     * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9
     */
    fun publishContest() {
        val currentState = _state.value
        
        // Task 12.1: Request validation before submission (Requirement 13.1)
        if (!validateAllSteps()) {
            _state.value = currentState.copy(
                error = "Please complete all required fields in all steps before publishing"
            )
            return
        }
        
        screenModelScope.launch {
            // Task 12.2: Add loading state management during submission (Requirement 13.8, 13.9)
            _state.value = currentState.copy(isPublishing = true, error = null)
            
            try {
                // Task 12.1: Construct comprehensive payload from all wizard steps (Requirement 13.1)
                
                // Convert TaskConfiguration list to RequiredActionDto list
                val requiredActions = currentState.addedTasks.map { task ->
                    RequiredActionDto(
                        type = when (task.type) {
                            TaskType.FOLLOW_KRIETA -> "FOLLOW_KRIETA"
                            TaskType.SUBSCRIBE_YOUTUBE -> "SUBSCRIBE_YOUTUBE"
                            TaskType.FOLLOW_SPOTIFY -> "FOLLOW_SPOTIFY"
                            TaskType.FOLLOW_INSTAGRAM -> "FOLLOW_INSTAGRAM"
                            TaskType.FOLLOW_TIKTOK -> "FOLLOW_TIKTOK"
                            TaskType.WATCH_VIDEO -> "WATCH_VIDEO"
                            TaskType.VISIT_SHOP -> "VISIT_SHOP"
                            TaskType.CUSTOM_TASK -> "CUSTOM_TASK"
                        },
                        targetUrl = task.data,
                        label = task.customName ?: getTaskTypeLabel(task.type)
                    )
                }
                
                // Convert prize amounts to prize distribution percentages
                val totalPrize = currentState.totalPrizePool
                val prizeDistribution = currentState.prizeAmounts.mapIndexed { index, amount ->
                    PrizeDistributionDto(
                        rank = index + 1,
                        percentage = if (totalPrize > 0) (amount / totalPrize) * 100.0 else 0.0
                    )
                }
                
                // Convert selection method to judging criteria
                val judgingCriteria = when (currentState.selectionMethod) {
                    SelectionMethod.MANUAL -> "CREATOR_PICKS"
                    SelectionMethod.RANDOM -> "MOST_ENGAGEMENT"
                    SelectionMethod.VOTING -> "COMMUNITY_VOTE"
                    SelectionMethod.COMBINATION -> "COMBINATION"
                }
                
                // Task 12.1: Add participationType field to request payload (Requirement 13.2)
                val participationTypeString = when (currentState.participationType) {
                    ParticipationType.INDIVIDUAL_ONLY -> "INDIVIDUAL_ONLY"
                    ParticipationType.TEAM_ONLY -> "TEAM_ONLY"
                    ParticipationType.BOTH -> "BOTH"
                }
                
                // Task 12.1: Include all wizard-configured fields in backend request (Requirement 13.1, 13.5)
                val request = CreateContestRequestDto(
                    title = currentState.title,
                    description = currentState.description,
                    mediaType = currentState.mediaType,
                    category = currentState.category,
                    prizeTotalKr = convertToKr(totalPrize, applyMargin = false), // Convert total prize pool to Kr
                    requiredActions = requiredActions,
                    maxWinners = currentState.winnerSlots,
                    prizeDistribution = prizeDistribution,
                    judgingCriteria = judgingCriteria,
                    sponsorName = null, // Not configured in wizard yet
                    sponsorUrl = null, // Not configured in wizard yet
                    deadline = currentState.endDate?.toString() ?: Clock.System.now().plus(7, DateTimeUnit.DAY, kotlinx.datetime.TimeZone.UTC).toString(),
                    coverMediaUrl = null, // Cover image upload not implemented in wizard yet
                    // Task 12.1: Add participationType, teamSize, maxTeams fields (Requirements 13.2, 13.3, 13.4)
                    participationType = participationTypeString,
                    teamSize = currentState.teamSize, // Optional: included when specified (Requirement 13.3)
                    maxTeams = currentState.maxTeams // Optional: included when specified (Requirement 13.4)
                )
                
                // Submit contest to backend
                when (val result = repository.createContest(request)) {
                    // Task 12.2: Implement success response handling with wizard closure (Requirement 13.6)
                    is NetworkResult.Success -> {
                        val contestId = result.data
                        
                        // Send judge invites if judges were assigned
                        if (currentState.judges.isNotEmpty()) {
                            val judgeIds = currentState.judges.map { it.userId }
                            when (repository.inviteJudges(contestId, judgeIds)) {
                                is NetworkResult.Success -> {
                                    // Judges invited successfully
                                    _state.value = _state.value.copy(
                                        isPublishing = false,
                                        success = true,
                                        error = null
                                    )
                                }
                                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                                    // Contest created but judge invites failed
                                    // Still mark as success since contest was created
                                    _state.value = _state.value.copy(
                                        isPublishing = false,
                                        success = true,
                                        error = "Contest created but some judge invites failed"
                                    )
                                }
                            }
                        } else {
                            _state.value = _state.value.copy(
                                isPublishing = false,
                                success = true,
                                error = null
                            )
                        }
                        // Note: The UI layer should observe the success state and close the wizard
                    }
                    // Task 12.2: Implement error response handling with error display (Requirement 13.7)
                    is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                        _state.value = _state.value.copy(
                            isPublishing = false,
                            success = false,
                            error = result.message ?: "Something went wrong. Please try again."
                        )
                        // Note: The UI remains on step 5 to allow the user to correct errors
                    }
                }
            } catch (e: Exception) {
                // Task 12.2: Handle unexpected errors (Requirement 13.7)
                _state.value = _state.value.copy(
                    isPublishing = false,
                    success = false,
                    error = "An error occurred: ${e.message}"
                )
            }
        }
    }
}

// Helper function to get task type labels
private fun getTaskTypeLabel(taskType: TaskType): String {
    return when (taskType) {
        TaskType.FOLLOW_KRIETA -> "Follow Krieta"
        TaskType.SUBSCRIBE_YOUTUBE -> "Subscribe YouTube"
        TaskType.FOLLOW_SPOTIFY -> "Follow Spotify"
        TaskType.FOLLOW_INSTAGRAM -> "Follow Instagram"
        TaskType.FOLLOW_TIKTOK -> "Follow TikTok"
        TaskType.WATCH_VIDEO -> "Watch Video"
        TaskType.VISIT_SHOP -> "Visit Shop"
        TaskType.CUSTOM_TASK -> "Custom Task"
    }
}

