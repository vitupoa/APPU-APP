package com.krieta.feature.contests.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ContestCreatorDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null
)

@Serializable
data class ContestPrizeDto(
    val prizeKr: Double,
    val platformFeeKr: Double,
    val totalChargedKr: Double
)

@Serializable
data class RequiredActionDto(
    val type: String,
    val targetUrl: String? = null,
    val label: String
)

@Serializable
data class ContestDto(
    val id: String,
    val creator: ContestCreatorDto,
    val title: String,
    val description: String,
    val mediaType: String,
    val contestCategory: String,
    val prizeKr: Double,
    val platformFeeKr: Double,
    val totalChargedKr: Double,
    val rules: List<String>,
    val requiredActions: List<RequiredActionDto>,
    val maxWinners: Int,
    val judgingCriteria: String,
    val sponsorName: String? = null,
    val sponsorUrl: String? = null,
    val deadline: String,
    val coverMediaUrl: String? = null,
    val status: String,
    val participantsCount: Int = 0,
    val submissionsCount: Int = 0,
    val isJoined: Boolean = false,
    val createdAt: String,
    // Team Participation Fields (Task 14.1)
    val participationType: String = "INDIVIDUAL_ONLY", // INDIVIDUAL_ONLY, TEAM_ONLY, or BOTH
    val teamSize: Int? = null, // Optional: 2-10 members
    val maxTeams: Int? = null, // Optional: maximum team registration limit
    val registeredTeamsCount: Int = 0 // Current number of registered teams
)

@Serializable
data class ContestListResponseDto(
    val items: List<ContestDto>,
    val nextCursor: String? = null
)

@Serializable
data class ContestSubmissionDto(
    val id: String,
    val user: ContestCreatorDto,
    val contestId: String,
    val mediaUrl: String,
    val mediaType: String,
    val proofScreenshots: List<String> = emptyList(),
    val votes: Int = 0,
    val rank: Int? = null,
    val createdAt: String
)

@Serializable
data class SubmissionsResponseDto(
    val items: List<ContestSubmissionDto>,
    val nextCursor: String? = null
)

@Serializable
data class PrizeDistributionDto(
    val rank: Int,
    val percentage: Double
)

@Serializable
data class CreateContestRequestDto(
    val title: String,
    val description: String,
    val mediaType: String,
    val category: String, // Matches backend 'category'
    val prizeKr: Double,
    val requiredActions: List<RequiredActionDto>,
    val maxWinners: Int,
    val prizeDistribution: List<PrizeDistributionDto>, // Matches backend requirement
    val judgingCriteria: String,
    val sponsorName: String? = null,
    val sponsorUrl: String? = null,
    val deadline: String,
    val coverMediaUrl: String? = null,
    // Team Participation Fields (Task 12.1)
    val participationType: String, // INDIVIDUAL_ONLY, TEAM_ONLY, or BOTH
    val teamSize: Int? = null, // Optional: 2-10 members
    val maxTeams: Int? = null // Optional: maximum team registration limit
)

@Serializable
data class CreateContestResponseDto(
    val contestId: String,
    val message: String = "Contest created successfully"
)

@Serializable
data class SubmitEntryRequestDto(
    val mediaUrl: String,
    val mediaType: String,
    val proofScreenshots: List<String> = emptyList()
)

@Serializable
data class ContestActionDto(
    val id: String,
    val actionType: String,
    val targetUrl: String?,
    val label: String,
    val isVerifiable: Boolean,
    val requiresUpload: Boolean,
    val sortOrder: Int
)

@Serializable
data class ContestRequirementsResponseDto(
    val actions: List<ContestActionDto>,
    val hasSubmitted: Boolean,
    val canSubmit: Boolean
)
