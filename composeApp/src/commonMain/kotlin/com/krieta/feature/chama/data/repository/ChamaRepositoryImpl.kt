package com.krieta.feature.chama.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.chama.data.remote.ChamaApi
import com.krieta.feature.chama.data.remote.dto.*
import com.krieta.feature.chama.domain.repository.ChamaRepository

class ChamaRepositoryImpl(
    private val api: ChamaApi
) : ChamaRepository {

    override suspend fun createChama(request: CreateChamaRequest): NetworkResult<ChamaDto> {
        return safeApiCall { 
            val response = api.createChama(request)
            response.chama ?: throw Exception(response.error ?: "Failed to create chama")
        }
    }

    override suspend fun getMyChamas(): NetworkResult<List<ChamaDto>> {
        return safeApiCall { 
            val response = api.getMyChamas()
            response.chamas
        }
    }

    override suspend fun discoverChamas(page: Int, limit: Int): NetworkResult<List<ChamaDto>> {
        return safeApiCall { 
            val response = api.discoverChamas(page, limit)
            response.chamas
        }
    }

    override suspend fun getChamaById(id: String): NetworkResult<ChamaDto> {
        return safeApiCall { 
            val response = api.getChamaById(id)
            response.chama ?: throw Exception(response.error ?: "Chama not found")
        }
    }

    override suspend fun updateChama(id: String, request: UpdateChamaRequest): NetworkResult<ChamaDto> {
        return safeApiCall { 
            val response = api.updateChama(id, request)
            response.chama ?: throw Exception(response.error ?: "Failed to update chama")
        }
    }

    override suspend fun activateChama(id: String): NetworkResult<ChamaDto> {
        return safeApiCall { 
            val response = api.activateChama(id)
            response.chama ?: throw Exception(response.error ?: "Failed to activate chama")
        }
    }

    override suspend fun joinChama(id: String): NetworkResult<ChamaDto> {
        return safeApiCall { 
            val response = api.joinChama(id)
            response.chama ?: throw Exception(response.error ?: "Failed to join chama")
        }
    }

    override suspend fun leaveChama(id: String): NetworkResult<Unit> {
        return safeApiCall { api.leaveChama(id); Unit }
    }

    override suspend fun removeMember(chamaId: String, memberUserId: String, reason: String): NetworkResult<Unit> {
        return safeApiCall { api.removeMember(chamaId, memberUserId, reason); Unit }
    }

    override suspend fun contribute(chamaId: String, amountKr: Double): NetworkResult<Unit> {
        return safeApiCall { api.contribute(chamaId, amountKr); Unit }
    }

    override suspend fun requestPayout(chamaId: String, request: RequestPayoutRequest): NetworkResult<Unit> {
        return safeApiCall { api.requestPayout(chamaId, request); Unit }
    }

    override suspend fun approvePayout(chamaId: String, payoutId: String, request: ApprovePayoutRequest): NetworkResult<Unit> {
        return safeApiCall { api.approvePayout(chamaId, payoutId, request); Unit }
    }

    override suspend fun getBalance(chamaId: String): NetworkResult<String> {
        return safeApiCall { 
            val response = api.getBalance(chamaId)
            response.krBalance ?: throw Exception(response.error ?: "Failed to get balance")
        }
    }

    override suspend fun getTransactions(chamaId: String, page: Int, limit: Int): NetworkResult<ChamaTransactionListResponseDto> {
        return safeApiCall { api.getTransactions(chamaId, page, limit) }
    }

    override suspend fun uploadReceipt(chamaId: String, request: UploadReceiptRequest): NetworkResult<Unit> {
        return safeApiCall { api.uploadReceipt(chamaId, request); Unit }
    }

    override suspend fun openCycle(chamaId: String): NetworkResult<ChamaCycleDto> {
        return safeApiCall { 
            val response = api.openCycle(chamaId)
            response.cycle ?: throw Exception(response.error ?: "Failed to open cycle")
        }
    }

    override suspend fun getCycles(chamaId: String): NetworkResult<List<ChamaCycleDto>> {
        return safeApiCall { 
            val response = api.getCycles(chamaId)
            response.cycles
        }
    }

    override suspend fun disburseCycle(chamaId: String, cycleId: String): NetworkResult<ChamaCycleDto> {
        return safeApiCall { 
            val response = api.disburseCycle(chamaId, cycleId)
            response.cycle ?: throw Exception(response.error ?: "Failed to disburse cycle")
        }
    }

    override suspend fun getActiveElections(chamaId: String): NetworkResult<List<ChamaElectionDto>> {
        return safeApiCall { 
            val response = api.getActiveElections(chamaId)
            response.elections
        }
    }

    override suspend fun startElection(chamaId: String, request: StartElectionRequest): NetworkResult<Unit> {
        return safeApiCall { api.startElection(chamaId, request); Unit }
    }

    override suspend fun getElectionStatus(chamaId: String, electionId: String): NetworkResult<ChamaElectionDto> {
        return safeApiCall { 
            val response = api.getElectionStatus(chamaId, electionId)
            response.election ?: throw Exception(response.error ?: "Failed to get election status")
        }
    }

    override suspend fun nominate(chamaId: String, electionId: String, request: NominateRequest): NetworkResult<Unit> {
        return safeApiCall { api.nominate(chamaId, electionId, request); Unit }
    }

    override suspend fun secondNomination(chamaId: String, electionId: String, nominationId: String): NetworkResult<Unit> {
        return safeApiCall { api.secondNomination(chamaId, electionId, nominationId); Unit }
    }

    override suspend fun advanceToVoting(chamaId: String, electionId: String): NetworkResult<Unit> {
        return safeApiCall { api.advanceToVoting(chamaId, electionId); Unit }
    }

    override suspend fun castVote(chamaId: String, electionId: String, request: CastVoteRequest): NetworkResult<Unit> {
        return safeApiCall { api.castVote(chamaId, electionId, request); Unit }
    }

    override suspend fun tallyVotes(chamaId: String, electionId: String): NetworkResult<Unit> {
        return safeApiCall { api.tallyVotes(chamaId, electionId); Unit }
    }

    override suspend fun getDefaulters(page: Int, limit: Int): NetworkResult<List<ChamaDefaulterDto>> {
        return safeApiCall { 
            val response = api.getDefaulters(page, limit)
            response.defaulters
        }
    }

    override suspend fun resolveDefault(defaultId: String): NetworkResult<Unit> {
        return safeApiCall { api.resolveDefault(defaultId); Unit }
    }
}
