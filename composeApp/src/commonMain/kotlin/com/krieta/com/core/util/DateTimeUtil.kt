package com.krieta.com.core.util

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.datetime.periodUntil
import kotlin.time.ExperimentalTime

expect fun platformNowMillis(): Long

@OptIn(ExperimentalTime::class)
object DateTimeUtil {


    fun now(): Instant = Instant.fromEpochMilliseconds(platformNowMillis())

    fun nowLocal(): LocalDateTime = now().toLocalDateTime(TimeZone.currentSystemDefault())

    fun Instant.toLocalTime(): LocalDateTime =
        this.toLocalDateTime(TimeZone.currentSystemDefault())

    fun timeAgo(instant: Instant): String {
        val currentTime = now()
        val duration = currentTime - instant
        val seconds = duration.inWholeSeconds
        val minutes = seconds / 60
        val hours = seconds / 3600
        val days = duration.inWholeDays

        return when {
            seconds < 60 -> "Just now"
            minutes < 60 -> "${minutes}m ago"
            hours < 24 -> "${hours}h ago"
            days < 7 -> "${days}d ago"
            days < 30 -> "${days / 7}w ago"
            days < 365 -> "${days / 30}mo ago"
            else -> "${days / 365}y ago"
        }
    }

    @kotlin.jvm.JvmName("timeAgoExt")
    fun Instant.timeAgo(): String = timeAgo(this)

    fun Instant.formatCountdown(): String {
        val currentTime = now()
        if (this <= currentTime) return "Ended"

        val duration = this - currentTime
        val days = duration.inWholeDays
        val hours = (duration.inWholeSeconds / 3600) % 24
        val minutes = (duration.inWholeSeconds / 60) % 60

        return when {
            days > 0 -> "${days}d ${hours}h"
            hours > 0 -> "${hours}h ${minutes}m"
            else -> "${minutes}m"
        }
    }

    fun Instant.formatDate(): String {
        val local = this.toLocalTime()
        val month = local.month.name.lowercase().replaceFirstChar { it.uppercase() }.take(3)
        return "$month ${local.dayOfMonth}, ${local.year}"
    }

    fun Instant.formatDateTime(): String {
        val local = this.toLocalTime()
        val month = local.month.name.lowercase().replaceFirstChar { it.uppercase() }.take(3)
        val hour = local.hour.toString().padStart(2, '0')
        val minute = local.minute.toString().padStart(2, '0')
        return "$month ${local.dayOfMonth}, ${local.year} $hour:$minute"
    }
}
