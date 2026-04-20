package com.krieta.feature.contests.domain.model

import kotlinx.datetime.Instant

data class ContestCreator(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?
)

data class RequiredAction(
    val type: String,
    val targetUrl: String?,
    val label: String
)

enum class ContestMediaType { PHOTO, VIDEO, PHOTO_AND_VIDEO }
enum class ContestCategory { DANCE, CHALLENGE, PROMOTION, CREATIVE, ART, MUSIC }
enum class JudgingCriteria { CREATOR_PICKS, COMMUNITY_VOTE, MOST_ENGAGEMENT }
enum class ContestStatus { DRAFT, ACTIVE, JUDGING, PENDING_PAYOUT, COMPLETED, CANCELLED }

// Team Participation Type (Task 14.1)
enum class ParticipationType {
    INDIVIDUAL_ONLY,
    TEAM_ONLY,
    BOTH;
    
    companion object {
        fun fromString(value: String): ParticipationType {
            return when (value.uppercase()) {
                "INDIVIDUAL_ONLY" -> INDIVIDUAL_ONLY
                "TEAM_ONLY" -> TEAM_ONLY
                "BOTH" -> BOTH
                else -> INDIVIDUAL_ONLY // Default fallback
            }
        }
    }
}

data class Contest(
    val id: String,
    val creator: ContestCreator,
    val title: String,
    val description: String,
    val mediaType: ContestMediaType,
    val contestCategory: ContestCategory,
    val prizeKr: Double,
    val platformFeeKr: Double,
    val totalChargedKr: Double,
    val rules: List<String>,
    val requiredActions: List<RequiredAction>,
    val maxWinners: Int,
    val judgingCriteria: JudgingCriteria,
    val sponsorName: String?,
    val sponsorUrl: String?,
    val deadline: String,
    val coverMediaUrl: String?,
    val status: ContestStatus,
    val participantsCount: Int,
    val submissionsCount: Int,
    val isJoined: Boolean,
    val createdAt: String,
    // Team Participation Fields (Task 14.1)
    val participationType: ParticipationType = ParticipationType.INDIVIDUAL_ONLY,
    val teamSize: Int? = null, // Optional: 2-10 members
    val maxTeams: Int? = null, // Optional: maximum team registration limit
    val registeredTeamsCount: Int = 0 // Current number of registered teams
)

data class ContestSubmission(
    val id: String,
    val user: ContestCreator,
    val contestId: String,
    val mediaUrl: String,
    val mediaType: String,
    val proofScreenshots: List<String>,
    val votes: Int,
    val rank: Int?,
    val createdAt: String
)

data class ContestAction(
    val id: String,
    val actionType: String,
    val targetUrl: String?,
    val label: String,
    val isVerifiable: Boolean,
    val requiresUpload: Boolean,
    val sortOrder: Int
)

data class ContestRequirements(
    val actions: List<ContestAction>,
    val hasSubmitted: Boolean,
    val canSubmit: Boolean
)
