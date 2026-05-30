package com.krieta.com.core.pagination

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class PagingDataSource<T>(
    private val pageSize: Int = 20,
    private val loadPage: suspend (page: Int, pageSize: Int) -> List<T>
) {
    private val _items = MutableStateFlow<List<T>>(emptyList())
    val items: StateFlow<List<T>> = _items.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    private var currentPage = 0
    private var hasMore = true
    
    suspend fun loadNextPage() {
        if (_isLoading.value || !hasMore) return
        
        _isLoading.value = true
        _error.value = null
        
        try {
            val newItems = loadPage(currentPage, pageSize)
            
            if (newItems.isEmpty()) {
                hasMore = false
            } else {
                _items.value = _items.value + newItems
                currentPage++
            }
        } catch (e: Exception) {
            _error.value = e.message ?: "Failed to load data"
        } finally {
            _isLoading.value = false
        }
    }
    
    fun reset() {
        _items.value = emptyList()
        _error.value = null
        currentPage = 0
        hasMore = true
    }
    
    suspend fun refresh() {
        reset()
        loadNextPage()
    }
    
    fun hasMoreData(): Boolean = hasMore
}
