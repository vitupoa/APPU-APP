package com.runinga.feature.analytics.data.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.safeApiCall
import com.runinga.feature.analytics.data.remote.AnalyticsApi
import com.runinga.feature.analytics.domain.model.*
import com.runinga.feature.analytics.domain.repository.AnalyticsRepository

class AnalyticsRepositoryImpl(
    private val api: AnalyticsApi
) : AnalyticsRepository {

    override suspend fun getCreatorAnalytics(days: Int): NetworkResult<CreatorAnalytics> =
        safeApiCall {
            val dto = api.getCreatorAnalytics(days)
            CreatorAnalytics(
                periodDays = dto.period.days,
                totals = AnalyticsTotals(
                    views = dto.totals.views,
                    likes = dto.totals.likes,
                    newAdmirers = dto.totals.newAdmirers,
                    krEarned = dto.totals.krEarned,
                    krSpent = dto.totals.krSpent
                ),
                followers = FollowerCounts(
                    admirers = dto.currentFollowers.admirers,
                    admiring = dto.currentFollowers.admiring
                ),
                earningsBreakdown = dto.earningsBreakdown.map {
                    EarningsBreakdownItem(type = it.type, totalRc = it.totalKr, count = it.count)
                },
                dailyStats = dto.dailyStats.map {
                    DailyStat(
                        date = it.date,
                        views = it.views,
                        likes = it.likes,
                        newAdmirers = it.newAdmirers,
                        krEarned = it.krEarned,
                        krSpent = it.krSpent
                    )
                }
            )
        }
}
