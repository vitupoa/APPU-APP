package com.krieta.feature.shorts.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import com.krieta.feature.sponsored.presentation.SponsoredContentManager
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
    val error: String? = null,
    val sponsoredIndices: Set<Int> = emptySet()
)

class ShortsViewModel(
    private val shortsRepository: ShortsRepository,
    private val sponsoredManager: SponsoredContentManager
) : ScreenModel {

    private val _state = MutableStateFlow(ShortsState())
    val state: StateFlow<ShortsState> = _state.asStateFlow()

    init {
        loadFeed()
    }

    fun setFeedType(feedType: ShortsFeedType) {
        val tab = when (feedType) {
            ShortsFeedType.DISCOVER -> ShortsTab.DISCOVER
            ShortsFeedType.ADMIRING -> ShortsTab.ADMIRING
        }
        selectTab(tab)
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
                    val items = injectSponsoredContent(result.data.items)
                    _state.value = _state.value.copy(
                        items = items,
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
                    val newItems = injectSponsoredContent(result.data.items, _state.value.items.size)
                    _state.value = _state.value.copy(
                        items = _state.value.items + newItems,
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

    private suspend fun injectSponsoredContent(items: List<Short>, startIndex: Int = 0): List<Short> {
        if (items.isEmpty()) return items
        
        // Inject every 7 items (industry best practice for short-form video)
        val result = mutableListOf<Short>()
        val sponsoredIndices = mutableSetOf<Int>()
        
        items.forEachIndexed { index, short ->
            result.add(short)
            
            // Inject sponsored content every 7 items
            if ((startIndex + index + 1) % 7 == 0) {
                sponsoredManager.fetchSponsoredContent("short")
                val sponsored = sponsoredManager.sponsoredContent.value
                
                if (sponsored != null) {
                    // Convert sponsored content to Short (assuming contentId points to a Short)
                    try {
                        when (val shortResult = shortsRepository.getShortById(sponsored.contentId)) {
                            is NetworkResult.Success -> {
                                result.add(shortResult.data)
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
        
        _state.value = _state.value.copy(sponsoredIndices = _state.value.sponsoredIndices + sponsoredIndices)
        return result
    }

    fun isSponsored(index: Int): Boolean = _state.value.sponsoredIndices.contains(index)

    fun recordSponsoredImpression(index: Int) {
        if (!isSponsored(index)) return
        screenModelScope.launch {
            sponsoredManager.recordImpression()
        }
    }

    fun recordSponsoredView(index: Int, watchTimeSeconds: Int) {
        if (!isSponsored(index)) return
        screenModelScope.launch {
            sponsoredManager.recordView(watchTimeSeconds)
        }
    }

    fun recordSponsoredEngagement(index: Int, type: String) {
        if (!isSponsored(index)) return
        screenModelScope.launch {
            sponsoredManager.recordEngagement(type)
        }
    }
}
