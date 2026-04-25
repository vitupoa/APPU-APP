package com.krieta.feature.chama.presentation.wizard

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.data.remote.dto.ChamaDto
import com.krieta.feature.chama.data.remote.dto.CreateChamaRequest
import com.krieta.feature.chama.domain.repository.ChamaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CreateChamaState(
    val currentStep: Int = 0,
    val name: String = "",
    val type: String = "ROTATING",
    val description: String = "",
    val reason: String = "",
    val maxMembers: String = "",
    val autoLockOnFull: Boolean = false,
    val contributionAmountKr: String = "",
    val contributionFrequency: String = "MONTHLY",
    val membershipFeeKr: String = "",
    val penaltyAmountKr: String = "",
    val gracePeriodDays: String = "3",
    val minApprovals: String = "2",
    val allowMidTermVoteOut: Boolean = true,
    val isLoading: Boolean = false,
    val error: String? = null,
    val createdChama: ChamaDto? = null
)

class CreateChamaViewModel(
    private val repository: ChamaRepository
) : ScreenModel {

    private val _state = MutableStateFlow(CreateChamaState())
    val state = _state.asStateFlow()

    val totalSteps = 4

    fun updateName(value: String) = _state.update { it.copy(name = value) }
    fun updateType(value: String) = _state.update { it.copy(type = value) }
    fun updateDescription(value: String) = _state.update { it.copy(description = value) }
    fun updateReason(value: String) = _state.update { it.copy(reason = value) }
    fun updateMaxMembers(value: String) = _state.update { it.copy(maxMembers = value) }
    fun updateAutoLockOnFull(value: Boolean) = _state.update { it.copy(autoLockOnFull = value) }
    fun updateContributionAmountKr(value: String) = _state.update { it.copy(contributionAmountKr = value) }
    fun updateContributionFrequency(value: String) = _state.update { it.copy(contributionFrequency = value) }
    fun updateMembershipFeeKr(value: String) = _state.update { it.copy(membershipFeeKr = value) }
    fun updatePenaltyAmountKr(value: String) = _state.update { it.copy(penaltyAmountKr = value) }
    fun updateGracePeriodDays(value: String) = _state.update { it.copy(gracePeriodDays = value) }
    fun updateMinApprovals(value: String) = _state.update { it.copy(minApprovals = value) }
    fun updateAllowMidTermVoteOut(value: Boolean) = _state.update { it.copy(allowMidTermVoteOut = value) }

    fun nextStep() {
        if (_state.value.currentStep < totalSteps - 1) {
            _state.update { it.copy(currentStep = it.currentStep + 1, error = null) }
        }
    }

    fun previousStep() {
        if (_state.value.currentStep > 0) {
            _state.update { it.copy(currentStep = it.currentStep - 1, error = null) }
        }
    }

    fun canProceed(): Boolean {
        val s = _state.value
        return when (s.currentStep) {
            0 -> s.name.length >= 2
            1 -> s.contributionAmountKr.toDoubleOrNull() != null && s.contributionAmountKr.toDouble() > 0
            2 -> true // Optional settings
            3 -> true // Confirmation
            else -> false
        }
    }

    fun createChama() {
        val s = _state.value
        if (s.isLoading) return

        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            val request = CreateChamaRequest(
                name = s.name.trim(),
                type = s.type,
                description = s.description.takeIf { it.isNotBlank() },
                reason = s.reason.takeIf { it.isNotBlank() },
                maxMembers = s.maxMembers.toIntOrNull(),
                autoLockOnFull = s.autoLockOnFull,
                contributionAmountKr = s.contributionAmountKr.toDouble(),
                contributionFrequency = s.contributionFrequency,
                membershipFeeKr = s.membershipFeeKr.toDoubleOrNull(),
                penaltyAmountKr = s.penaltyAmountKr.toDoubleOrNull(),
                gracePeriodDays = s.gracePeriodDays.toIntOrNull() ?: 3,
                minApprovals = s.minApprovals.toIntOrNull() ?: 2,
                allowMidTermVoteOut = s.allowMidTermVoteOut
            )

            when (val result = repository.createChama(request)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, createdChama = result.data) }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> { /* no-op */ }
            }
        }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
