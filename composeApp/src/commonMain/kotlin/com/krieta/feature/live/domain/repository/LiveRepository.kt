package com.krieta.feature.live.domain.repository

import com.krieta.feature.live.domain.model.LiveStream

interface LiveRepository {
    suspend fun startStream(
        title: String,
        description: String? = null,
        type: String = "NORMAL",
        isCoHostEnabled: Boolean = false
    ): Result<LiveStream>

    suspend fun endStream(streamId: String): Result<Unit>

    suspend fun getActiveStreams(page: Int = 1, limit: Int = 20, chamaId: String? = null): Result<List<LiveStream>>

    suspend fun getStreamDetails(streamId: String): Result<LiveStream>

    suspend fun setGiftGoal(streamId: String, title: String, targetKr: Double): Result<Unit>
}
