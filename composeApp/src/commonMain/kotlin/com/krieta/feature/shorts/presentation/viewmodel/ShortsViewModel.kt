package com.krieta.feature.shorts.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class ShortsTab(val label: String, val apiValue: String) {
    HOME("Home", "home"),
    DISCOVER("Discover", "discover"),
    ADMIRING("Admiring", "admiring")
}

data class ShortsState(
    val items: List<Short> = emptyList(),
    val currentIndex: Int = 0,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val activeTab: ShortsTab = ShortsTab.DISCOVER,
    val nextCursor: String? = null,
    val error: String? = null
)

class ShortsViewModel(
    private val shortsRepository: ShortsRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ShortsState())
    val state: StateFlow<ShortsState> = _state.asStateFlow()

    init {
        loadFeed()
    }

    fun selectTab(tab: ShortsTab) {
        if (_state.value.activeTab == tab) return
        _state.value = ShortsState(activeTab = tab) // Reset state on tab change
        loadFeed()
    }

    fun onShortVisible(index: Int) {
        _state.value = _state.value.copy(currentIndex = index)

        // Fire view increment non-blocking
        val short = _state.value.items.getOrNull(index) ?: return
        screenModelScope.launch { shortsRepository.incrementView(short.id) }

        // Pre-load more when approaching end
        val items = _state.value.items
        if (index >= items.size - 3 && _state.value.nextCursor != null && !_state.value.isLoadingMore) {
            loadMore()
        }
    }

    fun toggleLike(shortId: String) {
        screenModelScope.launch {
            when (val result = shortsRepository.toggleLike(shortId)) {
                is NetworkResult.Success -> {
                    val liked = result.data
                    _state.value = _state.value.copy(
                        items = _state.value.items.map { s ->
                            if (s.id == shortId) s.copy(
                                isLiked = liked,
                                likesCount = if (liked) s.likesCount + 1 else s.likesCount - 1
                            ) else s
                        }
                    )
                }
                else -> {}
            }
        }
    }

    private fun loadFeed() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = shortsRepository.getFeed(_state.value.activeTab.apiValue, null)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        items = result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingMore = true)
            when (val result = shortsRepository.getFeed(_state.value.activeTab.apiValue, cursor)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        items = _state.value.items + result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoadingMore = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoadingMore = false)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
