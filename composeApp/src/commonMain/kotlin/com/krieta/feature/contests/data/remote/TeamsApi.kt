package com.krieta.feature.contests.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.contests.data.remote.dto.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.*

class TeamsApi(private val httpClient: HttpClient) {

    suspend fun createTeam(request: CreateTeamRequest): TeamDto {
        return httpClient.post("${ApiConstants.BASE_URL}/teams") {
            setBody(request)
        }.body()
    }

    suspend fun getMyTeams(): List<TeamDto> {
        return httpClient.get("${ApiConstants.BASE_URL}/teams/my-teams").body()
    }

    suspend fun getTeam(teamId: String): TeamDto {
        return httpClient.get("${ApiConstants.BASE_URL}/teams/$teamId").body()
    }

    suspend fun inviteMember(teamId: String, request: InviteTeamMemberRequest) {
        httpClient.post("${ApiConstants.BASE_URL}/teams/$teamId/invite") {
            setBody(request)
        }
    }

    suspend fun respondToInvitation(invitationId: String, accept: Boolean) {
        httpClient.post("${ApiConstants.BASE_URL}/teams/invitations/$invitationId/${if (accept) "accept" else "reject"}")
    }

    suspend fun getMyInvitations(): List<TeamInvitationDto> {
        return httpClient.get("${ApiConstants.BASE_URL}/teams/invitations/pending").body()
    }

    suspend fun leaveTeam(teamId: String) {
        httpClient.post("${ApiConstants.BASE_URL}/teams/$teamId/leave")
    }

    suspend fun removeMember(teamId: String, memberId: String) {
        httpClient.delete("${ApiConstants.BASE_URL}/teams/$teamId/members/$memberId")
    }

    suspend fun updateMemberRole(teamId: String, memberId: String, role: String) {
        httpClient.put("${ApiConstants.BASE_URL}/teams/$teamId/members/$memberId/role") {
            setBody(mapOf("role" to role))
        }
    }

    suspend fun getTeamStats(teamId: String): TeamStatsDto {
        return httpClient.get("${ApiConstants.BASE_URL}/teams/$teamId/stats").body()
    }

    suspend fun listTeamContests(cursor: String?, limit: Int = 20): TeamContestListResponse {
        return httpClient.get("${ApiConstants.BASE_URL}/contests/team") {
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun registerTeamForContest(contestId: String, teamId: String) {
        httpClient.post("${ApiConstants.BASE_URL}/contests/team/$contestId/register") {
            setBody(mapOf("team_id" to teamId))
        }
    }

    suspend fun submitTeamEntry(contestId: String, teamId: String, request: SubmitTeamEntryRequest) {
        httpClient.post("${ApiConstants.BASE_URL}/contests/team/$contestId/submit") {
            setBody(request.copy())
            parameter("team_id", teamId)
        }
    }

    suspend fun getTeamSubmissions(contestId: String, cursor: String?, limit: Int = 20): List<TeamSubmissionDto> {
        return httpClient.get("${ApiConstants.BASE_URL}/contests/team/$contestId/submissions") {
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun voteTeamSubmission(submissionId: String) {
        httpClient.post("${ApiConstants.BASE_URL}/contests/team/submissions/$submissionId/vote")
    }
}
