package com.krieta.feature.analytics.domain.model

data class CreatorAnalytics(
    val periodDays: Int,
    val totals: AnalyticsTotals,
    val followers: FollowerCounts,
    val earningsBreakdown: List<EarningsBreakdownItem>,
    val dailyStats: List<DailyStat>
)

data class AnalyticsTotals(
    val views: Int,
    val likes: Int,
    val newAdmirers: Int,
    val krEarned: Double,
    val krSpent: Double
)

data class FollowerCounts(
    val admirers: Int,
    val admiring: Int
)

data class EarningsBreakdownItem(
    val type: String,
    val totalKr: Double,
    val count: Int
) {
    val displayLabel: String
        get() = when (type) {
            "tip_received" -> "Tips"
            "contest_prize" -> "Contest Prizes"
            "subscription_earned" -> "Subscriptions"
            "shop_sale" -> "Shop Sales"
            "ad_revenue" -> "Ad Revenue"
            else -> type.replace("_", " ").replaceFirstChar { it.uppercase() }
        }
}

data class DailyStat(
    val date: String,
    val views: Int,
    val likes: Int,
    val newAdmirers: Int,
    val krEarned: Double,
    val krSpent: Double
)
