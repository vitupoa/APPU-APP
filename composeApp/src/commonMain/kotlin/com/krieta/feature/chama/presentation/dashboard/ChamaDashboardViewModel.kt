package com.krieta.feature.chama.presentation.dashboard

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.data.remote.dto.*
import com.krieta.feature.chama.domain.repository.ChamaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChamaDashboardState(
    val chama: ChamaDto? = null,
    val transactions: List<ChamaTransactionDto> = emptyList(),
    val activeElections: List<ChamaElectionDto> = emptyList(),
    val cycles: List<ChamaCycleDto> = emptyList(),
    val walletBalance: String = "0",
    val isLoading: Boolean = true,
    val isContributing: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val selectedTab: Int = 0 // 0=Overview, 1=Members, 2=Transactions, 3=Elections
)

class ChamaDashboardViewModel(
    private val chamaId: String,
    private val repository: ChamaRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ChamaDashboardState())
    val state = _state.asStateFlow()

    init {
        loadChama()
    }

    fun loadChama() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.getChamaById(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(
                            chama = result.data,
                            walletBalance = result.data.chamaWallet?.krBalance ?: "0",
                            isLoading = false
                        )
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadTransactions(page: Int = 1) {
        screenModelScope.launch {
            when (val result = repository.getTransactions(chamaId, page)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(transactions = result.data.transactions) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadCycles() {
        screenModelScope.launch {
            when (val result = repository.getCycles(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(cycles = result.data) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun openCycle() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.openCycle(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, successMessage = "Cycle #${result.data.cycleNumber} opened successfully") }
                    loadCycles()
                    loadChama()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun disburseCycle(cycleId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.disburseCycle(chamaId, cycleId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, successMessage = "Cycle disbursed successfully") }
                    loadCycles()
                    loadChama()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadElections() {
        screenModelScope.launch {
            when (val result = repository.getActiveElections(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(activeElections = result.data) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun contribute(amountKr: Double) {
        screenModelScope.launch {
            _state.update { it.copy(isContributing = true) }
            when (val result = repository.contribute(chamaId, amountKr)) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(
                            isContributing = false,
                            successMessage = "Contribution of $amountKr Kr successful!"
                        )
                    }
                    loadChama()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isContributing = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun leaveChama() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.leaveChama(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, successMessage = "You have left the Chama") }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun activateChama() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.activateChama(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(isLoading = false, chama = result.data, successMessage = "Chama activated!")
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun setTab(index: Int) {
        _state.update { it.copy(selectedTab = index) }
        when (index) {
            2 -> if (_state.value.transactions.isEmpty()) loadTransactions()
            3 -> if (_state.value.activeElections.isEmpty()) loadElections()
            4 -> if (_state.value.cycles.isEmpty()) loadCycles()
        }
    }

    fun clearMessages() = _state.update { it.copy(error = null, successMessage = null) }
}
