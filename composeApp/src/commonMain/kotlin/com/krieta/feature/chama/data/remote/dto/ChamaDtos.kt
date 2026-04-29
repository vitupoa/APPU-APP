package com.krieta.feature.chama.data.remote.dto

import kotlinx.serialization.Serializable
import com.krieta.feature.chat.data.remote.dto.UserSnippetDto

@Serializable
data class ChamaDto(
    val id: String,
    val name: String,
    val type: String, // ROTATING, INVESTMENT, WELFARE, HYBRID
    val description: String? = null,
    val reason: String? = null,
    val avatarUrl: String? = null,
    val chatId: String,
    val creatorId: String,
    val maxMembers: Int? = null,
    val isLocked: Boolean,
    val autoLockOnFull: Boolean,
    val contributionAmountKr: String,
    val contributionFrequency: String, // DAILY, WEEKLY, BIWEEKLY, MONTHLY, ONE_OFF
    val membershipFeeKr: String? = null,
    val lockPeriodDays: Int? = null,
    val penaltyAmountKr: String? = null,
    val gracePeriodDays: Int,
    val currentCycleNumber: Int,
    val totalCycles: Int? = null,
    val minApprovals: Int,
    val allowMidTermVoteOut: Boolean,
    val status: String, // SETUP, ACTIVE, PAUSED, COMPLETED, DISSOLVED
    val createdAt: String,
    val updatedAt: String,
    val chamaWallet: ChamaWalletDto? = null,
    val members: List<ChamaMemberDto> = emptyList(),
    val _count: ChamaCountDto? = null
)

@Serializable
data class ChamaWalletDto(
    val id: String,
    val chamaId: String,
    val krBalance: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class ChamaMemberDto(
    val id: String,
    val chamaId: String,
    val userId: String,
    val role: String, // ADMIN, CHAIRPERSON, TREASURER, SECRETARY, MEMBER
    val rotationNumber: Int? = null,
    val status: String, // ACTIVE, SUSPENDED, LEFT, REMOVED, DEFAULTED
    val totalContributed: String,
    val totalReceived: String,
    val isDefaulter: Boolean,
    val joinedAt: String,
    val leftAt: String? = null,
    val user: UserSnippetDto? = null
)

@Serializable
data class ChamaCountDto(
    val members: Int = 0,
    val contributions: Int = 0
)

@Serializable
data class ChamaTransactionDto(
    val id: String,
    val chamaId: String,
    val userId: String? = null,
    val type: String, // CONTRIBUTION, PAYOUT, MEMBERSHIP_FEE, PENALTY, EXTERNAL
    val amountKr: String,
    val description: String? = null,
    val receiptUrl: String? = null,
    val createdAt: String,
    val user: UserSnippetDto? = null
)

@Serializable
data class ChamaDefaulterDto(
    val id: String,
    val userId: String,
    val chamaId: String,
    val chamaName: String,
    val amountOwedKr: String,
    val fineAmountKr: String,
    val isResolved: Boolean,
    val resolvedAt: String? = null,
    val createdAt: String,
    val user: UserSnippetDto? = null
)

@Serializable
data class ChamaElectionDto(
    val id: String,
    val chamaId: String,
    val position: String,
    val phase: String, // NOMINATION, SECONDING, VOTING, COMPLETED, RERUN
    val isMidTerm: Boolean,
    val createdAt: String,
    val completedAt: String? = null,
    val nominations: List<ChamaNominationDto> = emptyList()
)

@Serializable
data class ChamaNominationDto(
    val id: String,
    val electionId: String,
    val nomineeId: String,
    val nominatorId: String,
    val secondsCount: Int,
    val createdAt: String,
    val nominee: UserSnippetDto? = null,
    val nominator: UserSnippetDto? = null,
    val _count: NominationCountDto? = null
)

@Serializable
data class NominationCountDto(
    val seconds: Int = 0,
    val votes: Int = 0
)

// -- Requests --

@Serializable
data class CreateChamaRequest(
    val name: String,
    val type: String,
    val description: String? = null,
    val reason: String? = null,
    val maxMembers: Int? = null,
    val autoLockOnFull: Boolean = false,
    val contributionAmountKr: Double,
    val contributionFrequency: String,
    val membershipFeeKr: Double? = null,
    val lockPeriodDays: Int? = null,
    val penaltyAmountKr: Double? = null,
    val gracePeriodDays: Int = 3,
    val minApprovals: Int = 2,
    val allowMidTermVoteOut: Boolean = true
)

@Serializable
data class UpdateChamaRequest(
    val name: String? = null,
    val description: String? = null,
    val avatarUrl: String? = null,
    val maxMembers: Int? = null,
    val isLocked: Boolean? = null,
    val autoLockOnFull: Boolean? = null,
    val contributionAmountKr: Double? = null,
    val penaltyAmountKr: Double? = null,
    val gracePeriodDays: Int? = null,
    val minApprovals: Int? = null,
    val allowMidTermVoteOut: Boolean? = null,
    val status: String? = null
)

@Serializable
data class ContributeRequest(
    val amountKr: Double
)

@Serializable
data class RequestPayoutRequest(
    val recipientUserId: String,
    val amountKr: Double,
    val cycleId: String? = null
)

@Serializable
data class ApprovePayoutRequest(
    val decision: String, // APPROVED, REJECTED
    val reason: String? = null
)

@Serializable
data class UploadReceiptRequest(
    val description: String,
    val receiptUrl: String,
    val amountKr: Double? = null
)

@Serializable
data class RemoveMemberRequest(
    val reason: String
)

@Serializable
data class StartElectionRequest(
    val position: String,
    val isMidTerm: Boolean = false
)

@Serializable
data class NominateRequest(
    val nomineeId: String
)

@Serializable
data class CastVoteRequest(
    val nominationId: String
)

// -- Responses --

@Serializable
data class ChamaResponseDto(
    val success: Boolean,
    val chama: ChamaDto
)

@Serializable
data class ChamaListResponseDto(
    val success: Boolean,
    val chamas: List<ChamaDto>
)

@Serializable
data class ChamaDefaulterListResponseDto(
    val success: Boolean,
    val defaulters: List<ChamaDefaulterDto>
)

@Serializable
data class ChamaTransactionListResponseDto(
    val success: Boolean,
    val transactions: List<ChamaTransactionDto>,
    val total: Int,
    val page: Int,
    val limit: Int
)

@Serializable
data class ChamaBalanceResponseDto(
    val success: Boolean,
    val krBalance: String
)

@Serializable
data class ChamaElectionResponseDto(
    val success: Boolean,
    val election: ChamaElectionDto
)

@Serializable
data class ChamaElectionListResponseDto(
    val success: Boolean,
    val elections: List<ChamaElectionDto>
)

@Serializable
data class ChamaCycleDto(
    val id: String,
    val chamaId: String,
    val cycleNumber: Int,
    val recipientId: String?,
    val targetAmountKr: String,
    val collectedAmountKr: String,
    val startDate: String,
    val endDate: String,
    val status: String
)

@Serializable
data class ChamaCycleResponseDto(
    val success: Boolean,
    val cycle: ChamaCycleDto
)

@Serializable
data class ChamaCycleListResponseDto(
    val success: Boolean,
    val cycles: List<ChamaCycleDto>
)

@Serializable
data class DefaultSuccessResponseDto(
    val success: Boolean,
    val message: String? = null
)

@Serializable
data class ChamaBalanceDto(
    val krBalance: String,
    val totalContributions: String,
    val totalPayouts: String,
    val pendingPayouts: String
)

@Serializable
data class ChamaPayoutDto(
    val id: String,
    val chamaId: String,
    val recipientUserId: String,
    val amountKr: String,
    val status: String,
    val requestedAt: String,
    val approvedAt: String? = null,
    val recipient: UserSnippetDto? = null,
    val approvals: List<PayoutApprovalDto> = emptyList()
)

@Serializable
data class PayoutApprovalDto(
    val id: String,
    val payoutId: String,
    val approverId: String,
    val decision: String,
    val reason: String? = null,
    val createdAt: String,
    val approver: UserSnippetDto? = null
)

@Serializable
data class ChamaPayoutListResponseDto(
    val success: Boolean,
    val payouts: List<ChamaPayoutDto>
)
