package com.krieta.feature.explore.domain.repository

import com.krieta.feature.explore.domain.model.*

interface ExploreRepository {
    suspend fun getTrendingHashtags(limit: Int = 10): List<TrendingHashtag>
    suspend fun getTrendingShorts(category: ContentCategory? = null, limit: Int = 20): List<TrendingShort>
    suspend fun getTrendingContests(limit: Int = 10): List<TrendingContest>
    suspend fun getTrendingCreators(limit: Int = 10): List<TrendingCreator>
    suspend fun getLiveStreams(limit: Int = 20): List<LiveStream>
}
