package com.krieta.feature.shorts.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shorts.domain.model.Short
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import com.krieta.feature.feed.domain.repository.FeedRepository
import com.krieta.feature.sponsored.presentation.SponsoredContentManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

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
    val isRefreshing: Boolean = false,
    val activeTab: ShortsTab = ShortsTab.DISCOVER,
    val nextCursor: String? = null,
    val error: String? = null,
    val sponsoredIndices: Set<Int> = emptySet()
)

data class InteractionEvent(
    val contentId: String,
    val contentType: String,
    val signalType: String,
    val watchDuration: Long,
    val totalDuration: Long
)

class ShortsViewModel(
    private val shortsRepository: ShortsRepository,
    private val feedRepository: FeedRepository,
    private val sponsoredManager: SponsoredContentManager
) : ScreenModel {

    private val _state = MutableStateFlow(ShortsState())
    val state: StateFlow<ShortsState> = _state.asStateFlow()

    // Batch interaction tracking
    private val interactionQueue = mutableListOf<InteractionEvent>()
    private var batchJob: Job? = null

    init {
        loadFeed()
        startBatchInteractionWorker()
    }

    private fun startBatchInteractionWorker() {
        batchJob = screenModelScope.launch {
            while (isActive) {
                delay(10000) // Send batch every 10 seconds
                if (interactionQueue.isNotEmpty()) {
                    sendBatchInteractions()
                }
            }
        }
    }

    private suspend fun sendBatchInteractions() {
        val batch = interactionQueue.toList()
        interactionQueue.clear()
        
        batch.forEach { event ->
            try {
                feedRepository.trackInteraction(
                    event.contentId,
                    event.contentType,
                    event.signalType,
                    event.watchDuration,
                    event.totalDuration
                )
            } catch (e: Exception) {
                // Silent fail - don't block user experience
            }
        }
    }

    override fun onDispose() {
        super.onDispose()
        batchJob?.cancel()
        // Send remaining interactions before disposing
        screenModelScope.launch {
            if (interactionQueue.isNotEmpty()) {
                sendBatchInteractions()
            }
        }
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

    fun refresh() {
        _state.value = _state.value.copy(isRefreshing = true, error = null)
        screenModelScope.launch {
            val result = when (_state.value.activeTab) {
                ShortsTab.HOME -> shortsRepository.getFeed("home", null)
                else -> shortsRepository.getFeed(_state.value.activeTab.apiValue, null)
            }
            
            when (result) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        items = result.data.items,
                        nextCursor = result.data.nextCursor,
                        isRefreshing = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isRefreshing = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
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
                    val isLiked = result.data
                    val updatedItems = _state.value.items.map { short ->
                        if (short.id == shortId) {
                            short.copy(
                                isLiked = isLiked,
                                likesCount = if (isLiked) short.likesCount + 1 else short.likesCount - 1
                            )
                        } else short
                    }
                    _state.value = _state.value.copy(items = updatedItems)
                    
                    // Track interaction for recommendation system
                    if (_state.value.activeTab == ShortsTab.DISCOVER || _state.value.activeTab == ShortsTab.ADMIRING) {
                        trackInteraction(shortId, if (isLiked) "LIKE" else "UNLIKE")
                    }
                }
                else -> {}
            }
        }
    }

    // Interaction tracking methods with batching
    fun trackView(shortId: String, watchDuration: Long, totalDuration: Long) {
        if (_state.value.activeTab == ShortsTab.DISCOVER || _state.value.activeTab == ShortsTab.ADMIRING) {
            // Add to batch queue
            interactionQueue.add(
                InteractionEvent(
                    contentId = shortId,
                    contentType = "SHORT",
                    signalType = "VIEW",
                    watchDuration = watchDuration,
                    totalDuration = totalDuration
                )
            )
        }
    }

    fun trackComment(shortId: String) {
        if (_state.value.activeTab == ShortsTab.DISCOVER || _state.value.activeTab == ShortsTab.ADMIRING) {
            queueInteraction(shortId, "COMMENT")
        }
    }

    fun trackShare(shortId: String) {
        if (_state.value.activeTab == ShortsTab.DISCOVER || _state.value.activeTab == ShortsTab.ADMIRING) {
            queueInteraction(shortId, "SHARE")
        }
    }

    private fun queueInteraction(shortId: String, signalType: String) {
        interactionQueue.add(
            InteractionEvent(
                contentId = shortId,
                contentType = "SHORT",
                signalType = signalType,
                watchDuration = 0,
                totalDuration = 0
            )
        )
    }

    private fun trackInteraction(shortId: String, signalType: String) {
        // For immediate tracking (like/unlike)
        screenModelScope.launch {
            feedRepository.trackInteraction(
                contentId = shortId,
                contentType = "SHORT",
                signalType = signalType,
                watchDuration = 0,
                totalDuration = 0
            )
        }
    }

    private fun loadFeed() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            val result = when (_state.value.activeTab) {
                ShortsTab.HOME -> shortsRepository.getFeed("home", null)
                else -> shortsRepository.getFeed(_state.value.activeTab.apiValue, null)
            }
            
            when (result) {
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
            
            val result = shortsRepository.getFeed(_state.value.activeTab.apiValue, cursor)
            
            when (result) {
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

    private suspend fun injectSponsoredContent(items: List<Short>, startIndex: Int = 0): List<Short> {
        if (items.isEmpty()) return items
        
        val result = mutableListOf<Short>()
        val sponsoredIndices = mutableSetOf<Int>()
        
        items.forEachIndexed { index, short ->
            result.add(short)
            
            if ((startIndex + index + 1) % 7 == 0) {
                sponsoredManager.fetchSponsoredContent("short")
                val sponsored = sponsoredManager.sponsoredContent.value
                
                if (sponsored != null) {
                    try {
                        when (val shortResult = shortsRepository.getShortById(sponsored.contentId)) {
                            is NetworkResult.Success -> {
                                result.add(shortResult.data)
                                sponsoredIndices.add(result.size - 1)
                            }
                            else -> {}
                        }
                    } catch (e: Exception) {}
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
