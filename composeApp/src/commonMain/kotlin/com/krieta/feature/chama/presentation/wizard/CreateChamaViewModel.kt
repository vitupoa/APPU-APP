package com.krieta.feature.chama.presentation.wizard

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.util.SafeConversion
import com.krieta.com.core.security.InputValidator
import com.krieta.feature.chama.data.remote.dto.ChamaDto
import com.krieta.feature.chama.data.remote.dto.CreateChamaRequest
import com.krieta.feature.chama.domain.repository.ChamaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import com.krieta.com.core.util.formatString
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
    val contributionAmountFiat: String = "",
    val contributionFrequency: String = "MONTHLY",
    val membershipFeeKr: String = "",
    val membershipFeeFiat: String = "",
    val penaltyAmountKr: String = "",
    val penaltyAmountFiat: String = "",
    val gracePeriodDays: String = "3",
    val minApprovals: String = "2",
    val allowMidTermVoteOut: Boolean = true,
    val isLoading: Boolean = false,
    val error: String? = null,
    val createdChama: ChamaDto? = null,
    val userCurrency: String = "KES",
    val exchangeRate: Double? = null,
    val isLoadingRate: Boolean = false
)

class CreateChamaViewModel(
    private val repository: ChamaRepository,
    private val authRepository: com.krieta.feature.auth.domain.repository.AuthRepository,
    private val walletRepository: com.krieta.feature.wallet.domain.repository.WalletRepository
) : ScreenModel {

    init {
        screenModelScope.launch {
            authRepository.currentUser.collect { user ->
                user?.let {
                    _state.update { state -> state.copy(userCurrency = it.currency) }
                    fetchExchangeRate(it.currency)
                }
            }
        }
    }

    private fun fetchExchangeRate(currency: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoadingRate = true) }
            when (val result = walletRepository.getExchangeRate(currency)) {
                is NetworkResult.Success -> {
                    _state.update { state -> 
                        val rate = result.data.buyRate
                        val krFromContribution = state.contributionAmountFiat.toDoubleOrNull()?.let { fiat ->
                            formatString("%.2f", fiat * rate)
                        } ?: state.contributionAmountKr
                        
                        val krFromMembership = state.membershipFeeFiat.toDoubleOrNull()?.let { fiat ->
                            formatString("%.2f", fiat * rate)
                        } ?: state.membershipFeeKr

                        state.copy(
                            exchangeRate = rate, 
                            isLoadingRate = false,
                            contributionAmountKr = krFromContribution,
                            membershipFeeKr = krFromMembership
                        ) 
                    }
                }
                else -> {
                    _state.update { it.copy(isLoadingRate = false) }
                }
            }
        }
    }

    private val _state = MutableStateFlow(CreateChamaState())
    val state = _state.asStateFlow()

    val totalSteps = 4

    fun updateName(value: String) {
        try {
            val validated = InputValidator.validateText(value, "chama name")
            _state.update { it.copy(name = validated, error = null) }
        } catch (e: SecurityException) {
            _state.update { it.copy(error = e.message) }
        }
    }
    fun updateType(value: String) = _state.update { it.copy(type = value) }
    fun updateDescription(value: String) {
        try {
            val validated = InputValidator.validateText(value, "description")
            _state.update { it.copy(description = validated, error = null) }
        } catch (e: SecurityException) {
            _state.update { it.copy(error = e.message) }
        }
    }
    fun updateReason(value: String) {
        try {
            val validated = InputValidator.validateText(value, "reason")
            _state.update { it.copy(reason = validated, error = null) }
        } catch (e: SecurityException) {
            _state.update { it.copy(error = e.message) }
        }
    }
    fun updateMaxMembers(value: String) = _state.update { it.copy(maxMembers = value) }
    fun updateAutoLockOnFull(value: Boolean) = _state.update { it.copy(autoLockOnFull = value) }
    fun updateContributionAmountKr(value: String) {
        val kr = value.toDoubleOrNull()
        _state.update { state ->
            val newFiat = if (kr != null && state.exchangeRate != null) {
                formatString("%.2f", kr / state.exchangeRate)
            } else {
                if (value.isEmpty()) "" else state.contributionAmountFiat
            }
            state.copy(contributionAmountKr = value, contributionAmountFiat = newFiat)
        }
    }

    fun updateContributionAmountFiat(value: String) {
        val fiat = value.toDoubleOrNull()
        _state.update { state ->
            val newKr = if (fiat != null && state.exchangeRate != null) {
                formatString("%.2f", fiat * state.exchangeRate)
            } else {
                if (value.isEmpty()) "" else state.contributionAmountKr
            }
            state.copy(contributionAmountFiat = value, contributionAmountKr = newKr)
        }
    }
    fun updateContributionFrequency(value: String) = _state.update { it.copy(contributionFrequency = value) }
    fun updateMembershipFeeKr(value: String) {
        val kr = value.toDoubleOrNull()
        _state.update { state ->
            val newFiat = if (kr != null && state.exchangeRate != null) {
                formatString("%.2f", kr / state.exchangeRate)
            } else {
                if (value.isEmpty()) "" else state.membershipFeeFiat
            }
            state.copy(membershipFeeKr = value, membershipFeeFiat = newFiat)
        }
    }

    fun updateMembershipFeeFiat(value: String) {
        val fiat = value.toDoubleOrNull()
        _state.update { state ->
            val newKr = if (fiat != null && state.exchangeRate != null) {
                formatString("%.2f", fiat * state.exchangeRate)
            } else {
                if (value.isEmpty()) "" else state.membershipFeeKr
            }
            state.copy(membershipFeeFiat = value, membershipFeeKr = newKr)
        }
    }
    fun updatePenaltyAmountFiat(value: String) {
        val fiat = value.toDoubleOrNull()
        _state.update { state ->
            val newKr = if (fiat != null && state.exchangeRate != null) {
                formatString("%.2f", fiat * state.exchangeRate)
            } else {
                if (value.isEmpty()) "" else state.penaltyAmountKr
            }
            state.copy(penaltyAmountFiat = value, penaltyAmountKr = newKr)
        }
    }
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
            0 -> s.name.length >= 2 && s.description.isNotBlank() && s.reason.isNotBlank()
            1 -> {
                // Check if either Fiat or Kr amount is valid
                val krAmount = s.contributionAmountKr.toDoubleOrNull() ?: 0.0
                val fiatAmount = s.contributionAmountFiat.toDoubleOrNull() ?: 0.0
                val hasValidAmount = krAmount > 0 || fiatAmount > 0
                val hasFrequency = s.contributionFrequency.isNotBlank()
                hasValidAmount && hasFrequency
            }
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
                contributionAmountKr = s.contributionAmountKr.toDoubleOrNull() ?: s.contributionAmountFiat.toDoubleOrNull()?.let { it * (s.exchangeRate ?: 1.0) } ?: 0.0,
                contributionFrequency = s.contributionFrequency,
                membershipFeeKr = if (s.membershipFeeKr.isNotEmpty()) {
                    SafeConversion.toDoubleOrDefault(s.membershipFeeKr, "membershipFee", 0.0)
                } else null,
                penaltyAmountKr = if (s.penaltyAmountKr.isNotEmpty()) {
                    SafeConversion.toDoubleOrDefault(s.penaltyAmountKr, "penaltyAmount", 0.0)
                } else null,
                gracePeriodDays = s.gracePeriodDays.toIntOrNull() ?: 3,
                minApprovals = s.minApprovals.toIntOrNull() ?: 2,
                allowMidTermVoteOut = s.allowMidTermVoteOut
            )

            when (val result = repository.createChama(request)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, createdChama = result.data) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
