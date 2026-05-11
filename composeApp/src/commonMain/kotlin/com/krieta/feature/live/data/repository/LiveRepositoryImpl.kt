package com.krieta.feature.live.data.repository

import com.krieta.feature.live.data.model.ActiveStreamsResponseDto
import com.krieta.feature.live.data.model.LiveStreamDto
import com.krieta.feature.live.domain.model.LiveHost
import com.krieta.feature.live.domain.model.LiveStream
import com.krieta.feature.live.domain.model.LiveStreamStatus
import com.krieta.feature.live.domain.model.LiveStreamType
import com.krieta.feature.live.domain.repository.LiveRepository
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*

class LiveRepositoryImpl(
    private val client: HttpClient
) : LiveRepository {

    override suspend fun startStream(
        title: String,
        description: String?,
        type: String,
        isCoHostEnabled: Boolean
    ): Result<LiveStream> {
        return try {
            val response: LiveStreamDto = client.post("/api/v1/live/start") {
                setBody(
                    mapOf(
                        "title" to title,
                        "description" to description,
                        "type" to type,
                        "isCoHostEnabled" to isCoHostEnabled
                    )
                )
            }.body()
            Result.success(response.toDomain())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun endStream(streamId: String): Result<Unit> {
        return try {
            client.post("/api/v1/live/$streamId/end")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getActiveStreams(
        page: Int,
        limit: Int,
        chamaId: String?
    ): Result<List<LiveStream>> {
        return try {
            val httpResponse = client.get("/api/v1/live/active") {
                parameter("page", page)
                parameter("limit", limit)
                if (chamaId != null) parameter("chamaId", chamaId)
            }
            val response: ActiveStreamsResponseDto = httpResponse.body()
            Result.success(response.streams.map { it.toDomain() })
        } catch (e: Exception) {
            Result.failure(Exception("Failed to load live streams: ${e.message ?: "Unknown error"}"))
        }
    }

    override suspend fun getStreamDetails(streamId: String): Result<LiveStream> {
        return try {
            val response: LiveStreamDto = client.get("/api/v1/live/$streamId").body()
            Result.success(response.toDomain())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun setGiftGoal(streamId: String, title: String, targetKr: Double): Result<Unit> {
        return try {
            client.post("/api/v1/live/$streamId/gift-goal") {
                setBody(
                    mapOf(
                        "title" to title,
                        "targetKr" to targetKr
                    )
                )
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun LiveStreamDto.toDomain(): LiveStream {
        return LiveStream(
            id = id,
            hostId = hostId,
            title = title,
            description = description,
            thumbnailUrl = thumbnailUrl,
            type = try { LiveStreamType.valueOf(type) } catch (e: Exception) { LiveStreamType.NORMAL },
            status = try { LiveStreamStatus.valueOf(status) } catch (e: Exception) { LiveStreamStatus.SCHEDULED },
            streamKey = streamKey,
            streamUrl = streamUrl,
            playbackUrl = playbackUrl,
            viewerCount = viewerCount,
            peakViewers = peakViewers,
            likesCount = likesCount,
            totalTipsKr = totalTipsKr,
            giftGoalTitle = giftGoalTitle,
            giftGoalTarget = giftGoalTarget,
            giftGoalCurrent = giftGoalCurrent,
            isCoHostEnabled = isCoHostEnabled,
            host = host?.let {
                LiveHost(
                    id = it.id,
                    username = it.username,
                    displayName = it.displayName,
                    avatarUrl = it.avatarUrl,
                    isVerified = it.isVerified
                )
            }
        )
    }
}
