package com.krieta.feature.analytics.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class AnalyticsResponseDto(
    val period: AnalyticsPeriodDto,
    val totals: AnalyticsTotalsDto,
    val currentFollowers: FollowerCountsDto,
    val earningsBreakdown: List<EarningsBreakdownItemDto>,
    val dailyStats: List<DailyStatDto>
)

@Serializable
data class AnalyticsPeriodDto(
    val days: Int,
    val since: String
)

@Serializable
data class AnalyticsTotalsDto(
    val views: Int,
    val likes: Int,
    val newAdmirers: Int,
    val krEarned: Double,
    val krSpent: Double
)

@Serializable
data class FollowerCountsDto(
    val admirers: Int,
    val admiring: Int
)

@Serializable
data class EarningsBreakdownItemDto(
    val type: String,
    val totalKr: Double,
    val count: Int
)

@Serializable
data class DailyStatDto(
    val date: String,
    val views: Int,
    val likes: Int,
    val newAdmirers: Int,
    val krEarned: Double,
    val krSpent: Double
)
