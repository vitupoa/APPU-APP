package com.krieta.feature.stories.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.stories.domain.model.StoryGroup
import com.krieta.feature.stories.domain.repository.StoryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class StoriesState(
    val storyGroups: List<StoryGroup> = emptyList(),
    val myStories: StoryGroup? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

class StoriesViewModel(
    private val repository: StoryRepository
) : ScreenModel {

    private val _state = MutableStateFlow(StoriesState(isLoading = true))
    val state: StateFlow<StoriesState> = _state.asStateFlow()

    init {
        loadFeed()
        loadMyStories()
    }

    fun loadFeed() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.getFeed()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        storyGroups = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun markStoryAsViewed(storyId: String) {
        screenModelScope.launch {
            // Optimistically update UI state
            val currentGroups = _state.value.storyGroups.map { group ->
                group.copy(
                    stories = group.stories.map { story ->
                        if (story.id == storyId) story.copy(isViewed = true) else story
                    }
                )
            }
            _state.value = _state.value.copy(storyGroups = currentGroups)

            // Send to backend
            repository.viewStory(storyId)
        }
    }
    
    fun loadMyStories() {
        screenModelScope.launch {
            when (val result = repository.getMyStories()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        myStories = result.data.firstOrNull()
                    )
                }
                is NetworkResult.Error -> {
                    // Silently fail for my stories
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
    
    fun deleteStory(storyId: String) {
        screenModelScope.launch {
            when (val result = repository.deleteStory(storyId)) {
                is NetworkResult.Success -> {
                    // Remove from my stories
                    val updatedMyStories = _state.value.myStories?.copy(
                        stories = _state.value.myStories!!.stories.filter { it.id != storyId }
                    )
                    _state.value = _state.value.copy(
                        myStories = if (updatedMyStories?.stories?.isEmpty() == true) null else updatedMyStories
                    )
                    
                    // Also remove from feed if present
                    val updatedGroups = _state.value.storyGroups.map { group ->
                        group.copy(stories = group.stories.filter { it.id != storyId })
                    }.filter { it.stories.isNotEmpty() }
                    _state.value = _state.value.copy(storyGroups = updatedGroups)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
