package com.krieta.feature.chama.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.chama.data.remote.dto.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody

class ChamaApi(private val httpClient: HttpClient) {

    // --- Core CRUD ---
    suspend fun createChama(request: CreateChamaRequest): ChamaResponseDto {
        return httpClient.post(ApiConstants.CHAMAS) {
            setBody(request)
        }.body()
    }

    suspend fun getMyChamas(): ChamaListResponseDto {
        return httpClient.get(ApiConstants.CHAMAS).body()
    }

    suspend fun discoverChamas(page: Int = 1, limit: Int = 20): ChamaListResponseDto {
        return httpClient.get(ApiConstants.CHAMAS_DISCOVER) {
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    suspend fun getChamaById(id: String): ChamaResponseDto {
        return httpClient.get("${ApiConstants.CHAMAS}/$id").body()
    }

    suspend fun updateChama(id: String, request: UpdateChamaRequest): ChamaResponseDto {
        return httpClient.put("${ApiConstants.CHAMAS}/$id") {
            setBody(request)
        }.body()
    }

    suspend fun activateChama(id: String): ChamaResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$id/activate").body()
    }

    // --- Membership ---
    suspend fun joinChama(id: String): ChamaResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$id/join").body()
    }

    suspend fun leaveChama(id: String): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$id/leave").body()
    }

    suspend fun removeMember(chamaId: String, memberUserId: String, reason: String): DefaultSuccessResponseDto {
        return httpClient.delete("${ApiConstants.CHAMAS}/$chamaId/members/$memberUserId") {
            setBody(RemoveMemberRequest(reason))
        }.body()
    }

    // --- Finance ---
    suspend fun contribute(chamaId: String, amountKr: Double): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/contribute") {
            setBody(ContributeRequest(amountKr))
        }.body()
    }

    suspend fun requestPayout(chamaId: String, request: RequestPayoutRequest): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/payout") {
            setBody(request)
        }.body()
    }

    suspend fun approvePayout(chamaId: String, payoutId: String, request: ApprovePayoutRequest): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/payout/$payoutId/approve") {
            setBody(request)
        }.body()
    }

    suspend fun getBalance(chamaId: String): ChamaBalanceResponseDto {
        return httpClient.get("${ApiConstants.CHAMAS}/$chamaId/balance").body()
    }

    suspend fun getTransactions(chamaId: String, page: Int = 1, limit: Int = 50): ChamaTransactionListResponseDto {
        return httpClient.get("${ApiConstants.CHAMAS}/$chamaId/transactions") {
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    suspend fun uploadReceipt(chamaId: String, request: UploadReceiptRequest): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/receipt") {
            setBody(request)
        }.body()
    }

    // Cycles
    suspend fun openCycle(chamaId: String): ChamaCycleResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/cycles").body()
    }

    suspend fun getCycles(chamaId: String): ChamaCycleListResponseDto {
        return httpClient.get("${ApiConstants.CHAMAS}/$chamaId/cycles").body()
    }

    suspend fun disburseCycle(chamaId: String, cycleId: String): ChamaCycleResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/cycles/$cycleId/disburse").body()
    }

    // --- Elections ---
    suspend fun getActiveElections(chamaId: String): ChamaElectionListResponseDto {
        return httpClient.get("${ApiConstants.CHAMAS}/$chamaId/elections/active").body()
    }

    suspend fun startElection(chamaId: String, request: StartElectionRequest): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/elections") {
            setBody(request)
        }.body()
    }

    suspend fun getElectionStatus(chamaId: String, electionId: String): ChamaElectionResponseDto {
        return httpClient.get("${ApiConstants.CHAMAS}/$chamaId/elections/$electionId").body()
    }

    suspend fun nominate(chamaId: String, electionId: String, request: NominateRequest): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/elections/$electionId/nominate") {
            setBody(request)
        }.body()
    }

    suspend fun secondNomination(chamaId: String, electionId: String, nominationId: String): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/elections/$electionId/second/$nominationId").body()
    }

    suspend fun advanceToVoting(chamaId: String, electionId: String): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/elections/$electionId/advance").body()
    }

    suspend fun castVote(chamaId: String, electionId: String, request: CastVoteRequest): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/elections/$electionId/vote") {
            setBody(request)
        }.body()
    }

    suspend fun tallyVotes(chamaId: String, electionId: String): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/$chamaId/elections/$electionId/tally").body()
    }

    // --- Defaulters ---
    suspend fun getDefaulters(page: Int = 1, limit: Int = 20): ChamaDefaulterListResponseDto {
        return httpClient.get(ApiConstants.CHAMAS_DEFAULTERS) {
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    suspend fun resolveDefault(defaultId: String): DefaultSuccessResponseDto {
        return httpClient.post("${ApiConstants.CHAMAS}/defaulters/$defaultId/resolve").body()
    }
}
