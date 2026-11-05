package com.runinga.feature.sponsored.presentation

import com.runinga.feature.sponsored.data.remote.SponsoredApi
import com.runinga.feature.sponsored.domain.model.SponsoredContent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Sponsored Content Manager - Replaces AdMob
 * Fetches and tracks native sponsored shorts that blend seamlessly in feed
 */
class SponsoredContentManager(private val api: SponsoredApi) {
    
    private val _sponsoredContent = MutableStateFlow<SponsoredContent?>(null)
    val sponsoredContent: StateFlow<SponsoredContent?> = _sponsoredContent
    
    private var impressionRecorded = false
    private var viewRecorded = false
    
    /**
     * Fetch sponsored content for user's feed
     */
    suspend fun fetchSponsoredContent(contentType: String = "short") {
        try {
            val content = api.getSponsoredContentForFeed(contentType)
            _sponsoredContent.value = content
            impressionRecorded = false
            viewRecorded = false
        } catch (e: Exception) {
            _sponsoredContent.value = null
        }
    }
    
    /**
     * Record impression when sponsored content appears on screen
     */
    suspend fun recordImpression() {
        val content = _sponsoredContent.value ?: return
        if (impressionRecorded) return
        
        try {
            api.recordImpression(content.id)
            impressionRecorded = true
        } catch (e: Exception) {
            // Silent fail
        }
    }
    
    /**
     * Record view when user watches for 3+ seconds
     */
    suspend fun recordView(watchTimeSeconds: Int) {
        val content = _sponsoredContent.value ?: return
        if (viewRecorded || watchTimeSeconds < 3) return
        
        try {
            api.recordView(content.id, watchTimeSeconds)
            viewRecorded = true
        } catch (e: Exception) {
            // Silent fail
        }
    }
    
    /**
     * Record engagement (like, comment, share)
     */
    suspend fun recordEngagement(type: String) {
        val content = _sponsoredContent.value ?: return
        
        try {
            api.recordEngagement(content.id, type)
        } catch (e: Exception) {
            // Silent fail
        }
    }
    
    /**
     * Check if current content is sponsored
     */
    fun isSponsored(contentId: String): Boolean {
        return _sponsoredContent.value?.contentId == contentId
    }
    
    /**
     * Clear current sponsored content
     */
    fun clear() {
        _sponsoredContent.value = null
        impressionRecorded = false
        viewRecorded = false
    }
}
