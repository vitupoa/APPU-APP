package com.krieta.feature.contests.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.model.ContestRequirements
import com.krieta.feature.contests.domain.model.ContestSubmission

data class ContestListResult(val items: List<Contest>, val nextCursor: String?)
data class SubmissionsResult(val items: List<ContestSubmission>, val nextCursor: String?)

interface ContestsRepository {
    suspend fun listContests(status: String?, cursor: String?): NetworkResult<ContestListResult>
    suspend fun getContest(contestId: String): NetworkResult<Contest>
    suspend fun getContestById(contestId: String): NetworkResult<Contest>
    suspend fun joinContest(contestId: String): NetworkResult<Unit>
    suspend fun getSubmissions(contestId: String, cursor: String?): NetworkResult<SubmissionsResult>
    suspend fun getLeaderboard(contestId: String): NetworkResult<List<ContestSubmission>>
    suspend fun createContest(request: com.krieta.feature.contests.data.remote.dto.CreateContestRequestDto): NetworkResult<String>
    suspend fun getContestRequirements(contestId: String): NetworkResult<ContestRequirements>
    suspend fun submitEntry(contestId: String, mediaUrl: String, mediaType: String, proofUrls: List<String>): NetworkResult<Unit>
    
    // Judge Invite Methods
    suspend fun inviteJudges(contestId: String, judgeIds: List<String>): NetworkResult<List<com.krieta.feature.contests.domain.model.JudgeInvite>>
    suspend fun getJudgeInvitations(): NetworkResult<List<com.krieta.feature.contests.domain.model.JudgeInvite>>
    suspend fun acceptJudgeInvite(inviteId: String): NetworkResult<Unit>
    suspend fun declineJudgeInvite(inviteId: String): NetworkResult<Unit>
}
