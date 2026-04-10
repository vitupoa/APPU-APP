package com.krieta.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.repository.ContestsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ContestFeedState {
    data object Loading : ContestFeedState()
    data class Success(
        val items: List<Contest>,
        val nextCursor: String?,
        val activeFilter: String?
    ) : ContestFeedState()
    data class Error(val message: String) : ContestFeedState()
}

class ContestFeedViewModel(
    private val repository: ContestsRepository
) : ScreenModel {

    private val _state = MutableStateFlow<ContestFeedState>(ContestFeedState.Loading)
    val state: StateFlow<ContestFeedState> = _state.asStateFlow()

    private val _isLoadingMore = MutableStateFlow(false)
    val isLoadingMore: StateFlow<Boolean> = _isLoadingMore.asStateFlow()

    init { loadContests(null) }

    fun applyFilter(status: String?) {
        _state.value = ContestFeedState.Loading
        loadContests(status)
    }

    fun loadMore() {
        val current = _state.value as? ContestFeedState.Success ?: return
        val cursor = current.nextCursor ?: return
        if (_isLoadingMore.value) return

        screenModelScope.launch {
            _isLoadingMore.value = true
            when (val result = repository.listContests(current.activeFilter, cursor)) {
                is NetworkResult.Success -> {
                    _state.value = current.copy(
                        items = current.items + result.data.items,
                        nextCursor = result.data.nextCursor
                    )
                }
                else -> {}
            }
            _isLoadingMore.value = false
        }
    }

    fun refresh() {
        val current = _state.value as? ContestFeedState.Success
        _state.value = ContestFeedState.Loading
        loadContests(current?.activeFilter)
    }

    private fun loadContests(status: String?) {
        screenModelScope.launch {
            when (val result = repository.listContests(status, null)) {
                is NetworkResult.Success -> {
                    _state.value = ContestFeedState.Success(
                        items = result.data.items,
                        nextCursor = result.data.nextCursor,
                        activeFilter = status
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = ContestFeedState.Error(result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
