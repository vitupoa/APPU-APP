package com.runinga.feature.contests.presentation.screen.wizard

import androidx.compose.runtime.Composable
import kotlinx.datetime.Instant
import kotlin.time.ExperimentalTime

/**
 * Platform-specific date/time picker interface
 * 
 * This expect/actual pattern allows for native date/time pickers on each platform:
 * - Android: Material DatePicker and TimePicker
 * - iOS: UIDatePicker
 * 
 * Requirements: 2.4, 2.5
 */
@OptIn(ExperimentalTime::class)
@Composable
expect fun DateTimePicker(
    currentDate: Instant?,
    onDateSelected: (Instant?) -> Unit,
    onDismiss: () -> Unit
)
