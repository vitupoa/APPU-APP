package com.krieta.feature.contests.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.contests.data.remote.dto.ContestRequirementsResponseDto
import com.krieta.feature.contests.data.remote.dto.ContestDto
import com.krieta.feature.contests.data.remote.dto.ContestListResponseDto
import com.krieta.feature.contests.data.remote.dto.ContestSubmissionDto
import com.krieta.feature.contests.data.remote.dto.SubmissionsResponseDto
import com.krieta.feature.contests.data.remote.dto.SubmitEntryRequestDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class ContestsApi(private val httpClient: HttpClient) {

    suspend fun listContests(status: String?, cursor: String?, limit: Int = 20): ContestListResponseDto {
        return httpClient.get(ApiConstants.CONTESTS) {
            status?.let { parameter("status", it) }
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun getContest(contestId: String): ContestDto {
        return httpClient.get("${ApiConstants.CONTESTS}/$contestId").body()
    }

    suspend fun joinContest(contestId: String) {
        httpClient.post("${ApiConstants.CONTESTS}/$contestId/join")
    }

    suspend fun getSubmissions(contestId: String, cursor: String?, limit: Int = 20): SubmissionsResponseDto {
        return httpClient.get("${ApiConstants.CONTESTS}/$contestId/submissions") {
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun getLeaderboard(contestId: String): List<ContestSubmissionDto> {
        return httpClient.get("${ApiConstants.CONTESTS}/$contestId/leaderboard").body()
    }

    suspend fun createContest(request: com.krieta.feature.contests.data.remote.dto.CreateContestRequestDto): com.krieta.feature.contests.data.remote.dto.CreateContestResponseDto {
        return httpClient.post(ApiConstants.CONTESTS) {
            setBody(request)
        }.body()
    }

    suspend fun getContestRequirements(contestId: String): ContestRequirementsResponseDto {
        return httpClient.get("${ApiConstants.CONTESTS}/$contestId/requirements").body()
    }

    suspend fun submitEntry(contestId: String, request: SubmitEntryRequestDto): ContestSubmissionDto {
        return httpClient.post("${ApiConstants.CONTESTS}/$contestId/submit") {
            setBody(request)
        }.body()
    }
    
    // Judge Invite Endpoints
    suspend fun inviteJudges(contestId: String, request: com.krieta.feature.contests.data.remote.dto.JudgeInviteRequestDto): com.krieta.feature.contests.data.remote.dto.JudgeInviteResponseDto {
        return httpClient.post("${ApiConstants.CONTESTS}/$contestId/judges/invite") {
            setBody(request)
        }.body()
    }
    
    suspend fun getJudgeInvitations(): List<com.krieta.feature.contests.data.remote.dto.JudgeInviteDto> {
        return httpClient.get("${ApiConstants.CONTESTS}/judge/invitations").body()
    }
    
    suspend fun acceptJudgeInvite(inviteId: String) {
        httpClient.post("${ApiConstants.CONTESTS}/judge/invitations/$inviteId/accept")
    }
    
    suspend fun declineJudgeInvite(inviteId: String) {
        httpClient.post("${ApiConstants.CONTESTS}/judge/invitations/$inviteId/decline")
    }
    
    // Voting Endpoint
    suspend fun voteSubmission(submissionId: String, fingerprint: String) {
        httpClient.post("${ApiConstants.CONTESTS}/vote") {
            setBody(mapOf(
                "submissionId" to submissionId,
                "fingerprint" to fingerprint
            ))
        }
    }
}
