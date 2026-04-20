package com.krieta.feature.contests.domain.model

data class Team(
    val id: String,
    val name: String,
    val avatarUrl: String?,
    val leaderId: String,
    val members: List<TeamMember>,
    val maxMembers: Int,
    val totalWins: Int,
    val totalPrizes: Double,
    val createdAt: String
)

data class TeamMember(
    val id: String,
    val userId: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val role: TeamRole,
    val joinedAt: String,
    val isOnline: Boolean = false
)

enum class TeamRole {
    LEADER,
    CO_LEADER,
    MEMBER
}

data class TeamContest(
    val id: String,
    val title: String,
    val description: String,
    val coverMediaUrl: String?,
    val prizeKr: Double,
    val teamSize: Int, // Required team size (2-10)
    val maxTeams: Int,
    val registeredTeams: Int,
    val judgingCriteria: JudgingCriteria,
    val deadline: String,
    val status: ContestStatus,
    val createdAt: String
)

data class TeamSubmission(
    val id: String,
    val teamId: String,
    val team: Team,
    val contestId: String,
    val mediaUrl: String,
    val mediaType: String,
    val caption: String?,
    val contributors: List<String>, // User IDs who contributed
    val votesCount: Int,
    val rank: Int?,
    val submittedAt: String
)

data class TeamInvitation(
    val id: String,
    val teamId: String,
    val teamName: String,
    val inviterId: String,
    val inviterName: String,
    val inviteeId: String,
    val status: InvitationStatus,
    val expiresAt: String,
    val createdAt: String
)

enum class InvitationStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    EXPIRED
}

data class TeamStats(
    val teamId: String,
    val totalContests: Int,
    val wins: Int,
    val topThree: Int,
    val totalPrizes: Double,
    val winRate: Double,
    val averageRank: Double
)

data class TeamChatInfo(
    val teamId: String,
    val chatId: String, // Links to main chat feature
    val unreadCount: Int
)
