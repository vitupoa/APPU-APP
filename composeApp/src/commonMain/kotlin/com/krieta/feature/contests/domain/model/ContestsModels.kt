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
enum class ContestStatus { DRAFT, ACTIVE, JUDGING, COMPLETED, CANCELLED }

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
    val createdAt: String
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
