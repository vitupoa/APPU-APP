package com.runinga.feature.explore.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.feature.explore.domain.model.*
import com.runinga.feature.explore.domain.repository.ExploreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ExploreState(
    val isLoading: Boolean = false,
    val trendingHashtags: List<TrendingHashtag> = emptyList(),
    val trendingShorts: List<TrendingShort> = emptyList(),
    val trendingContests: List<TrendingContest> = emptyList(),
    val trendingCreators: List<TrendingCreator> = emptyList(),
    val selectedCategory: ContentCategory = ContentCategory.ALL,
    val error: String? = null
)

class ExploreViewModel(
    private val repository: ExploreRepository
) : ScreenModel {
    
    private val _state = MutableStateFlow(ExploreState())
    val state: StateFlow<ExploreState> = _state.asStateFlow()
    
    init {
        loadTrendingContent()
    }
    
    fun loadTrendingContent() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val hashtags = repository.getTrendingHashtags()
                val shorts = repository.getTrendingShorts(_state.value.selectedCategory)
                val contests = repository.getTrendingContests()
                val creators = repository.getTrendingCreators()
                
                _state.value = _state.value.copy(
                    isLoading = false,
                    trendingHashtags = hashtags,
                    trendingShorts = shorts,
                    trendingContests = contests,
                    trendingCreators = creators,
                    error = null
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load trending content"
                )
            }
        }
    }
    
    fun selectCategory(category: ContentCategory) {
        _state.value = _state.value.copy(selectedCategory = category)
        screenModelScope.launch {
            try {
                val shorts = repository.getTrendingShorts(category)
                _state.value = _state.value.copy(trendingShorts = shorts)
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message)
            }
        }
    }
    
    fun refresh() {
        loadTrendingContent()
    }
}
