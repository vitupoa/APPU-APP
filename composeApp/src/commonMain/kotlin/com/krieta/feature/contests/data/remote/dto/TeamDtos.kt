package com.krieta.feature.contests.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TeamDto(
    val id: String,
    val name: String,
    @SerialName("avatar_url") val avatarUrl: String?,
    @SerialName("leader_id") val leaderId: String,
    val members: List<TeamMemberDto>,
    @SerialName("max_members") val maxMembers: Int,
    @SerialName("total_wins") val totalWins: Int,
    @SerialName("total_prizes") val totalPrizes: Double,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class TeamMemberDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val username: String,
    @SerialName("display_name") val displayName: String,
    @SerialName("avatar_url") val avatarUrl: String?,
    val role: String,
    @SerialName("joined_at") val joinedAt: String,
    @SerialName("is_online") val isOnline: Boolean = false
)

@Serializable
data class CreateTeamRequest(
    val name: String,
    @SerialName("avatar_url") val avatarUrl: String?,
    @SerialName("max_members") val maxMembers: Int
)

@Serializable
data class TeamContestDto(
    val id: String,
    val title: String,
    val description: String,
    @SerialName("cover_media_url") val coverMediaUrl: String?,
    @SerialName("prize_kr") val prizeKr: Double,
    @SerialName("team_size") val teamSize: Int,
    @SerialName("max_teams") val maxTeams: Int,
    @SerialName("registered_teams") val registeredTeams: Int,
    @SerialName("judging_criteria") val judgingCriteria: String,
    val deadline: String,
    val status: String,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class TeamSubmissionDto(
    val id: String,
    @SerialName("team_id") val teamId: String,
    val team: TeamDto,
    @SerialName("contest_id") val contestId: String,
    @SerialName("media_url") val mediaUrl: String,
    @SerialName("media_type") val mediaType: String,
    val caption: String?,
    val contributors: List<String>,
    @SerialName("votes_count") val votesCount: Int,
    val rank: Int?,
    @SerialName("submitted_at") val submittedAt: String
)

@Serializable
data class TeamInvitationDto(
    val id: String,
    @SerialName("team_id") val teamId: String,
    @SerialName("team_name") val teamName: String,
    @SerialName("inviter_id") val inviterId: String,
    @SerialName("inviter_name") val inviterName: String,
    @SerialName("invitee_id") val inviteeId: String,
    val status: String,
    @SerialName("expires_at") val expiresAt: String,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class InviteTeamMemberRequest(
    @SerialName("user_id") val userId: String
)

@Serializable
data class SubmitTeamEntryRequest(
    @SerialName("media_url") val mediaUrl: String,
    @SerialName("media_type") val mediaType: String,
    val caption: String?,
    val contributors: List<String>
)

@Serializable
data class TeamStatsDto(
    @SerialName("team_id") val teamId: String,
    @SerialName("total_contests") val totalContests: Int,
    val wins: Int,
    @SerialName("top_three") val topThree: Int,
    @SerialName("total_prizes") val totalPrizes: Double,
    @SerialName("win_rate") val winRate: Double,
    @SerialName("average_rank") val averageRank: Double
)

@Serializable
data class TeamListResponse(
    val items: List<TeamDto>,
    @SerialName("next_cursor") val nextCursor: String?
)

@Serializable
data class TeamContestListResponse(
    val items: List<TeamContestDto>,
    @SerialName("next_cursor") val nextCursor: String?
)
