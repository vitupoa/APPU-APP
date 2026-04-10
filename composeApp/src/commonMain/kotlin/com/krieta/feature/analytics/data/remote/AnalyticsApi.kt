package com.krieta.feature.analytics.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.analytics.data.remote.dto.AnalyticsResponseDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter

class AnalyticsApi(private val client: HttpClient) {

    suspend fun getCreatorAnalytics(days: Int = 30): AnalyticsResponseDto {
        return client.get(ApiConstants.ANALYTICS) {
            parameter("days", days)
        }.body()
    }
}
