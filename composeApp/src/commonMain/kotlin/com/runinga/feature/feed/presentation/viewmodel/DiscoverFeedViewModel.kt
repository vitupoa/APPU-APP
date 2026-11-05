package com.runinga.feature.feed.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.util.currentTimeMillis
import com.runinga.feature.feed.domain.repository.FeedRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ContentItem(
    val id: String,
    val type: String, // SHORT or POST
    val videoUrl: String?,
    val imageUrls: List<String>?,
    val thumbnailUrl: String?,
    val caption: String?,
    val userId: String,
    val userName: String,
    val userAvatar: String?,
    val isAdmired: Boolean,
    val likesCount: Int,
    val commentsCount: Int,
    val isLiked: Boolean,
    val isLocked: Boolean,
    val isContest: Boolean,
    val isAd: Boolean,
    val createdAt: String
)

data class DiscoverFeedState(
    val items: List<ContentItem> = emptyList(),
    val currentIndex: Int = 0,
    val nextCursor: String? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val error: String? = null,
    val composition: FeedComposition? = null
)

data class FeedComposition(
    val personalized: Int,
    val admiring: Int,
    val trending: Int,
    val discovery: Int
)

class DiscoverFeedViewModel(
    private val repository: FeedRepository
) : ScreenModel {

    private val _state = MutableStateFlow(DiscoverFeedState(isLoading = true))
    val state: StateFlow<DiscoverFeedState> = _state.asStateFlow()

    private var watchStartTime = 0L
    private var currentVideoDuration = 0L

    init { loadFeed() }

    fun loadFeed() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.getDiscoverFeed(limit = 20, cursor = null)) {
                is NetworkResult.Success -> {
                    _state.value = DiscoverFeedState(
                        items = result.data.content,
                        nextCursor = result.data.nextCursor,
                        composition = result.data.composition,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = DiscoverFeedState(isLoading = false, error = result.message)
                }
            }
        }
    }

    fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        if (_state.value.isLoadingMore) return
        
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingMore = true)
            when (val result = repository.getDiscoverFeed(limit = 20, cursor = cursor)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        items = _state.value.items + result.data.content,
                        nextCursor = result.data.nextCursor,
                        isLoadingMore = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoadingMore = false)
                }
            }
        }
    }

    fun onVideoIndexChanged(newIndex: Int) {
        // Track previous video view
        if (_state.value.currentIndex != newIndex && watchStartTime > 0) {
            val watchDuration = currentTimeMillis() - watchStartTime
            trackView(watchDuration)
        }

        _state.value = _state.value.copy(currentIndex = newIndex)
        watchStartTime = currentTimeMillis()

        // Preload next videos
        if (newIndex >= _state.value.items.size - 3) {
            loadMore()
        }
    }

    fun onVideoPositionChanged(position: Long, duration: Long) {
        currentVideoDuration = duration
    }

    fun onLike(contentId: String) {
        screenModelScope.launch {
            trackInteraction(contentId, "LIKE")
            
            // Update local state
            _state.value = _state.value.copy(
                items = _state.value.items.map { item ->
                    if (item.id == contentId) {
                        item.copy(
                            isLiked = !item.isLiked,
                            likesCount = if (item.isLiked) item.likesCount - 1 else item.likesCount + 1
                        )
                    } else item
                }
            )
        }
    }

    fun onComment(contentId: String) {
        trackInteraction(contentId, "COMMENT")
    }

    fun onShare(contentId: String) {
        trackInteraction(contentId, "SHARE")
    }

    fun onAdmire(userId: String) {
        screenModelScope.launch {
            val currentItem = _state.value.items.getOrNull(_state.value.currentIndex)
            if (currentItem != null) {
                trackInteraction(currentItem.id, "ADMIRE")
                
                // Update local state
                _state.value = _state.value.copy(
                    items = _state.value.items.map { item ->
                        if (item.userId == userId) {
                            item.copy(isAdmired = true)
                        } else item
                    }
                )
            }
        }
    }

    fun onSkip() {
        val currentItem = _state.value.items.getOrNull(_state.value.currentIndex)
        if (currentItem != null && watchStartTime > 0) {
            val watchDuration = currentTimeMillis() - watchStartTime
            if (watchDuration < 2000) { // Skipped within 2 seconds
                trackInteraction(currentItem.id, "SKIP")
            }
        }
    }

    fun onNotInterested(contentId: String) {
        trackInteraction(contentId, "NOT_INTERESTED")
    }

    private fun trackView(watchDuration: Long) {
        val currentItem = _state.value.items.getOrNull(_state.value.currentIndex) ?: return
        
        screenModelScope.launch {
            repository.trackInteraction(
                contentId = currentItem.id,
                contentType = currentItem.type,
                signalType = "VIEW",
                watchDuration = watchDuration,
                totalDuration = currentVideoDuration
            )
        }
    }

    private fun trackInteraction(contentId: String, signalType: String) {
        val item = _state.value.items.find { it.id == contentId } ?: return
        
        screenModelScope.launch {
            repository.trackInteraction(
                contentId = contentId,
                contentType = item.type,
                signalType = signalType,
                watchDuration = if (watchStartTime > 0) currentTimeMillis() - watchStartTime else 0,
                totalDuration = currentVideoDuration
            )
        }
    }

    override fun onDispose() {
        super.onDispose()
        // Track final video view
        if (watchStartTime > 0) {
            val watchDuration = currentTimeMillis() - watchStartTime
            trackView(watchDuration)
        }
    }
}
