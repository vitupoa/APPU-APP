package com.runinga.com.core.security

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

/**
 * Client-side rate limiter for withdrawal operations
 * Prevents rapid withdrawal attempts and enforces daily limits
 */
class WithdrawalRateLimiter {
    
    private val mutex = Mutex()
    private val withdrawalHistory = mutableListOf<WithdrawalAttempt>()
    
    data class WithdrawalAttempt(
        val timestamp: Instant,
        val amountKr: Double
    )
    
    data class RateLimitConfig(
        val maxWithdrawalsPerHour: Int = 3,
        val maxWithdrawalsPerDay: Int = 10,
        val maxAmountPerHourKr: Double = 100000.0, // 100,000 Rc per hour
        val maxAmountPerDayKr: Double = 500000.0,  // 500,000 Rc per day
        val cooldownBetweenLargeWithdrawals: Duration = 5.minutes, // 5 min cooldown for >50k Rc
        val largeWithdrawalThresholdKr: Double = 50000.0
    )
    
    sealed class RateLimitResult {
        object Allowed : RateLimitResult()
        data class Denied(val reason: String, val retryAfter: Duration? = null) : RateLimitResult()
    }
    
    private val config = RateLimitConfig()
    
    /**
     * Check if withdrawal is allowed based on rate limits
     */
    suspend fun checkWithdrawal(amountKr: Double): RateLimitResult = mutex.withLock {
        val now = Clock.System.now()
        
        // Clean up old history (older than 24 hours)
        cleanupOldHistory(now)
        
        // Check hourly withdrawal count
        val withdrawalsLastHour = getWithdrawalsInWindow(now, 1.hours)
        if (withdrawalsLastHour.size >= config.maxWithdrawalsPerHour) {
            val oldestInWindow = withdrawalsLastHour.minByOrNull { it.timestamp.toEpochMilliseconds() }
            val retryAfter = oldestInWindow?.let { 
                val millis = (it.timestamp.toEpochMilliseconds() + 3600000) - now.toEpochMilliseconds()
                kotlin.time.Duration.parse("${millis}ms")
            }
            return@withLock RateLimitResult.Denied(
                "Maximum ${config.maxWithdrawalsPerHour} withdrawals per hour exceeded. Please try again later.",
                retryAfter
            )
        }
        
        // Check daily withdrawal count
        val withdrawalsLastDay = getWithdrawalsInWindow(now, 24.hours)
        if (withdrawalsLastDay.size >= config.maxWithdrawalsPerDay) {
            val oldestInWindow = withdrawalsLastDay.minByOrNull { it.timestamp.toEpochMilliseconds() }
            val retryAfter = oldestInWindow?.let { 
                val millis = (it.timestamp.toEpochMilliseconds() + 86400000) - now.toEpochMilliseconds()
                kotlin.time.Duration.parse("${millis}ms")
            }
            return@withLock RateLimitResult.Denied(
                "Maximum ${config.maxWithdrawalsPerDay} withdrawals per day exceeded. Please try again tomorrow.",
                retryAfter
            )
        }
        
        // Check hourly amount limit
        val totalAmountLastHour = withdrawalsLastHour.sumOf { it.amountRc }
        if (totalAmountLastHour + amountRc > config.maxAmountPerHourKr) {
            val remaining = config.maxAmountPerHourRc - totalAmountLastHour
            return@withLock RateLimitResult.Denied(
                "Hourly withdrawal limit exceeded. You can withdraw up to ${remaining.toInt()} Rc more this hour."
            )
        }
        
        // Check daily amount limit
        val totalAmountLastDay = withdrawalsLastDay.sumOf { it.amountRc }
        if (totalAmountLastDay + amountRc > config.maxAmountPerDayKr) {
            val remaining = config.maxAmountPerDayRc - totalAmountLastDay
            return@withLock RateLimitResult.Denied(
                "Daily withdrawal limit exceeded. You can withdraw up to ${remaining.toInt()} Rc more today."
            )
        }
        
        // Check cooldown for large withdrawals
        if (amountRc >= config.largeWithdrawalThresholdKr) {
            val lastLargeWithdrawal = withdrawalsLastHour
                .filter { it.amountRc >= config.largeWithdrawalThresholdRc }
                .maxByOrNull { it.timestamp.toEpochMilliseconds() }
            
            if (lastLargeWithdrawal != null) {
                val timeSinceLastLargeMillis = now.toEpochMilliseconds() - lastLargeWithdrawal.timestamp.toEpochMilliseconds()
                val cooldownMillis = config.cooldownBetweenLargeWithdrawals.inWholeMilliseconds
                if (timeSinceLastLargeMillis < cooldownMillis) {
                    val retryAfterMillis = cooldownMillis - timeSinceLastLargeMillis
                    val retryAfter = kotlin.time.Duration.parse("${retryAfterMillis}ms")
                    return@withLock RateLimitResult.Denied(
                        "Please wait ${retryAfterMillis / 60000} minutes between large withdrawals (>50,000 Rc).",
                        retryAfter
                    )
                }
            }
        }
        
        RateLimitResult.Allowed
    }
    
    /**
     * Record a successful withdrawal
     */
    suspend fun recordWithdrawal(amountKr: Double) = mutex.withLock {
        withdrawalHistory.add(
            WithdrawalAttempt(
                timestamp = Clock.System.now(),
                amountRc = amountKr
            )
        )
    }
    
    /**
     * Get withdrawal statistics for display
     */
    suspend fun getWithdrawalStats(): WithdrawalStats = mutex.withLock {
        val now = Clock.System.now()
        cleanupOldHistory(now)
        
        val lastHour = getWithdrawalsInWindow(now, 1.hours)
        val lastDay = getWithdrawalsInWindow(now, 24.hours)
        
        WithdrawalStats(
            withdrawalsLastHour = lastHour.size,
            withdrawalsLastDay = lastDay.size,
            amountLastHourRc = lastHour.sumOf { it.amountRc },
            amountLastDayRc = lastDay.sumOf { it.amountRc },
            remainingWithdrawalsToday = (config.maxWithdrawalsPerDay - lastDay.size).coerceAtLeast(0),
            remainingAmountTodayRc = (config.maxAmountPerDayRc - lastDay.sumOf { it.amountRc }).coerceAtLeast(0.0)
        )
    }
    
    /**
     * Reset all withdrawal history (for testing or user request)
     */
    suspend fun reset() = mutex.withLock {
        withdrawalHistory.clear()
    }
    
    private fun getWithdrawalsInWindow(now: Instant, window: Duration): List<WithdrawalAttempt> {
        val cutoffMillis = now.toEpochMilliseconds() - window.inWholeMilliseconds
        return withdrawalHistory.filter { it.timestamp.toEpochMilliseconds() >= cutoffMillis }
    }
    
    private fun cleanupOldHistory(now: Instant) {
        val cutoffMillis = now.toEpochMilliseconds() - 86400000 // 24 hours
        withdrawalHistory.removeAll { it.timestamp.toEpochMilliseconds() < cutoffMillis }
    }
    
    data class WithdrawalStats(
        val withdrawalsLastHour: Int,
        val withdrawalsLastDay: Int,
        val amountLastHourKr: Double,
        val amountLastDayKr: Double,
        val remainingWithdrawalsToday: Int,
        val remainingAmountTodayKr: Double
    )
}
