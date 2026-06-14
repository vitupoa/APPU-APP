package com.krieta.feature.chama.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.data.remote.dto.*

interface ChamaRepository {
    // CRUD
    suspend fun createChama(request: CreateChamaRequest): NetworkResult<ChamaDto>
    suspend fun getMyChamas(): NetworkResult<List<ChamaDto>>
    suspend fun discoverChamas(page: Int = 1, limit: Int = 20): NetworkResult<List<ChamaDto>>
    suspend fun getChamaById(id: String): NetworkResult<ChamaDto>
    suspend fun updateChama(id: String, request: UpdateChamaRequest): NetworkResult<ChamaDto>
    suspend fun activateChama(id: String): NetworkResult<ChamaDto>
    suspend fun deleteChama(id: String): NetworkResult<Boolean>

    // Membership
    suspend fun joinChama(id: String): NetworkResult<ChamaDto>
    suspend fun leaveChama(id: String): NetworkResult<Unit>
    suspend fun removeMember(chamaId: String, memberUserId: String, reason: String): NetworkResult<Unit>

    // Finance
    suspend fun contribute(chamaId: String, amountKr: Double): NetworkResult<Unit>
    suspend fun requestPayout(chamaId: String, request: RequestPayoutRequest): NetworkResult<Unit>
    suspend fun approvePayout(chamaId: String, payoutId: String, request: ApprovePayoutRequest): NetworkResult<Unit>
    suspend fun getBalance(chamaId: String): NetworkResult<String>
    suspend fun getTransactions(chamaId: String, page: Int = 1, limit: Int = 50): NetworkResult<ChamaTransactionListResponseDto>
    suspend fun uploadReceipt(chamaId: String, request: UploadReceiptRequest): NetworkResult<Unit>

    // Cycles
    suspend fun openCycle(chamaId: String): NetworkResult<ChamaCycleDto>
    suspend fun getCycles(chamaId: String): NetworkResult<List<ChamaCycleDto>>
    suspend fun disburseCycle(chamaId: String, cycleId: String): NetworkResult<ChamaCycleDto>

    // Elections
    suspend fun getActiveElections(chamaId: String): NetworkResult<List<ChamaElectionDto>>
    suspend fun startElection(chamaId: String, request: StartElectionRequest): NetworkResult<Unit>
    suspend fun getElectionStatus(chamaId: String, electionId: String): NetworkResult<ChamaElectionDto>
    suspend fun nominate(chamaId: String, electionId: String, request: NominateRequest): NetworkResult<Unit>
    suspend fun secondNomination(chamaId: String, electionId: String, nominationId: String): NetworkResult<Unit>
    suspend fun advanceToVoting(chamaId: String, electionId: String): NetworkResult<Unit>
    suspend fun castVote(chamaId: String, electionId: String, request: CastVoteRequest): NetworkResult<Unit>
    suspend fun tallyVotes(chamaId: String, electionId: String): NetworkResult<Unit>

    // Defaulters
    suspend fun getDefaulters(page: Int = 1, limit: Int = 20): NetworkResult<List<ChamaDefaulterDto>>
    suspend fun resolveDefault(defaultId: String): NetworkResult<Unit>
}
