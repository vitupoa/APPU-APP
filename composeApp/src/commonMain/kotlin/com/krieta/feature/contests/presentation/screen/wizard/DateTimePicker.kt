package com.krieta.feature.contests.presentation.screen.wizard

import androidx.compose.runtime.Composable
import kotlinx.datetime.Instant

/**
 * Platform-specific date/time picker interface
 * 
 * This expect/actual pattern allows for native date/time pickers on each platform:
 * - Android: Material DatePicker and TimePicker
 * - iOS: UIDatePicker
 * 
 * Requirements: 2.4, 2.5
 */
@Composable
expect fun DateTimePicker(
    currentDate: Instant?,
    onDateSelected: (Instant?) -> Unit,
    onDismiss: () -> Unit
)
