package com.krieta.feature.contests.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.model.ContestSubmission

data class ContestListResult(val items: List<Contest>, val nextCursor: String?)
data class SubmissionsResult(val items: List<ContestSubmission>, val nextCursor: String?)

interface ContestsRepository {
    suspend fun listContests(status: String?, cursor: String?): NetworkResult<ContestListResult>
    suspend fun getContest(contestId: String): NetworkResult<Contest>
    suspend fun joinContest(contestId: String): NetworkResult<Unit>
    suspend fun getSubmissions(contestId: String, cursor: String?): NetworkResult<SubmissionsResult>
    suspend fun getLeaderboard(contestId: String): NetworkResult<List<ContestSubmission>>
}
