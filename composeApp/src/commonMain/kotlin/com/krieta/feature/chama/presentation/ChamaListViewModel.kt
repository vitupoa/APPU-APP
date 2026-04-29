package com.krieta.feature.chama.presentation

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.data.remote.dto.ChamaDto
import com.krieta.feature.chama.data.remote.dto.ChamaDefaulterDto
import com.krieta.feature.chama.domain.repository.ChamaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChamaListState(
    val myChamas: List<ChamaDto> = emptyList(),
    val discoverChamas: List<ChamaDto> = emptyList(),
    val defaulters: List<ChamaDefaulterDto> = emptyList(),
    val isLoading: Boolean = true,
    val selectedTab: Int = 0, // 0=My Chamas, 1=Discover, 2=Shame List
    val error: String? = null,
    val joiningId: String? = null
)

class ChamaListViewModel(
    private val repository: ChamaRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ChamaListState())
    val state = _state.asStateFlow()

    init {
        loadMyChamas()
    }

    fun loadMyChamas() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.getMyChamas()) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(myChamas = result.data, isLoading = false) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadDiscover() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.discoverChamas()) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(discoverChamas = result.data, isLoading = false) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun joinChama(chamaId: String) {
        screenModelScope.launch {
            _state.update { it.copy(joiningId = chamaId) }
            when (repository.joinChama(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(joiningId = null) }
                    loadMyChamas()
                    loadDiscover()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(joiningId = null, error = it.error) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadDefaulters() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.getDefaulters()) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(defaulters = result.data, isLoading = false) }
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
            1 -> if (_state.value.discoverChamas.isEmpty()) loadDiscover()
            2 -> if (_state.value.defaulters.isEmpty()) loadDefaulters()
        }
    }
}
