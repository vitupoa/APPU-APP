package com.runinga.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.contests.domain.model.Contest
import com.runinga.feature.contests.domain.repository.ContestsRepository
import com.runinga.feature.sponsored.presentation.SponsoredContentManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ContestFeedState {
    data object Loading : ContestFeedState()
    data class Success(
        val items: List<Contest>,
        val nextCursor: String?,
        val activeFilter: String?,
        val sponsoredIndices: Set<Int> = emptySet()
    ) : ContestFeedState()
    data class Error(val message: String) : ContestFeedState()
}

class ContestFeedViewModel(
    private val repository: ContestsRepository,
    private val sponsoredManager: SponsoredContentManager
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
                    val newItems = injectSponsoredContent(result.data.items, current.items.size)
                    _state.value = current.copy(
                        items = current.items + newItems,
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
                    val items = injectSponsoredContent(result.data.items)
                    _state.value = ContestFeedState.Success(
                        items = items,
                        nextCursor = result.data.nextCursor,
                        activeFilter = status
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = ContestFeedState.Error(result.message)
                }
            }
        }
    }

    private suspend fun injectSponsoredContent(items: List<Contest>, startIndex: Int = 0): List<Contest> {
        if (items.isEmpty()) return items
        
        // Inject every 6 items for contests feed
        val result = mutableListOf<Contest>()
        val sponsoredIndices = mutableSetOf<Int>()
        
        items.forEachIndexed { index, contest ->
            result.add(contest)
            
            // Inject sponsored content every 6 items
            if ((startIndex + index + 1) % 6 == 0) {
                sponsoredManager.fetchSponsoredContent("contest")
                val sponsored = sponsoredManager.sponsoredContent.value
                
                if (sponsored != null) {
                    try {
                        when (val contestResult = repository.getContestById(sponsored.contentId)) {
                            is NetworkResult.Success -> {
                                result.add(contestResult.data)
                                sponsoredIndices.add(result.size - 1)
                            }
                            else -> {}
                        }
                    } catch (e: Exception) {
                        // Silent fail
                    }
                }
            }
        }
        
        val current = _state.value as? ContestFeedState.Success
        if (current != null) {
            _state.value = current.copy(sponsoredIndices = current.sponsoredIndices + sponsoredIndices)
        }
        return result
    }

    fun isSponsored(index: Int): Boolean {
        val current = _state.value as? ContestFeedState.Success ?: return false
        return current.sponsoredIndices.contains(index)
    }

    fun recordSponsoredImpression(index: Int) {
        if (!isSponsored(index)) return
        screenModelScope.launch {
            sponsoredManager.recordImpression()
        }
    }

    fun recordSponsoredEngagement(index: Int, type: String) {
        if (!isSponsored(index)) return
        screenModelScope.launch {
            sponsoredManager.recordEngagement(type)
        }
    }
}
