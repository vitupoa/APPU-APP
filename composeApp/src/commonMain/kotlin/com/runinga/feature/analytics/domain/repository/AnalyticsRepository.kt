package com.runinga.feature.analytics.domain.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.analytics.domain.model.CreatorAnalytics

interface AnalyticsRepository {
    suspend fun getCreatorAnalytics(days: Int = 30): NetworkResult<CreatorAnalytics>
}
