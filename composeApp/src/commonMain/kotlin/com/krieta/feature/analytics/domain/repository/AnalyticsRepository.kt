package com.krieta.feature.analytics.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.analytics.domain.model.CreatorAnalytics

interface AnalyticsRepository {
    suspend fun getCreatorAnalytics(days: Int = 30): NetworkResult<CreatorAnalytics>
}
