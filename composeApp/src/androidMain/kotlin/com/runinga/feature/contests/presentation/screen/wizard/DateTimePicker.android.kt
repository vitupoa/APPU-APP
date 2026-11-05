package com.runinga.feature.contests.presentation.screen.wizard

import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.toInstant

/**
 * Android implementation of DateTimePicker using Material3 DatePicker and TimePicker
 * 
 * Requirements: 2.4, 2.5
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
actual fun DateTimePicker(
    currentDate: Instant?,
    onDateSelected: (Instant?) -> Unit,
    onDismiss: () -> Unit
) {
    var showDatePicker by remember { mutableStateOf(true) }
    var showTimePicker by remember { mutableStateOf(false) }
    var selectedDateMillis by remember { mutableStateOf(currentDate?.toEpochMilliseconds()) }
    
    val timeZone = TimeZone.currentSystemDefault()
    val currentLocalDateTime = currentDate?.toLocalDateTime(timeZone)
    
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = selectedDateMillis
    )
    
    val timePickerState = rememberTimePickerState(
        initialHour = currentLocalDateTime?.hour ?: 12,
        initialMinute = currentLocalDateTime?.minute ?: 0,
        is24Hour = true
    )
    
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = onDismiss,
            confirmButton = {
                TextButton(
                    onClick = {
                        selectedDateMillis = datePickerState.selectedDateMillis
                        showDatePicker = false
                        showTimePicker = true
                    }
                ) {
                    Text("Next", color = Color(0xFFF5A623))
                }
            },
            dismissButton = {
                TextButton(onClick = onDismiss) {
                    Text("Cancel", color = Color(0xFFA0A0A0))
                }
            }
        ) {
            DatePicker(
                state = datePickerState,
                colors = androidx.compose.material3.DatePickerDefaults.colors(
                    selectedDayContainerColor = Color(0xFFF5A623),
                    todayContentColor = Color(0xFFF5A623),
                    todayDateBorderColor = Color(0xFFF5A623)
                )
            )
        }
    }
    
    if (showTimePicker) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = onDismiss,
            confirmButton = {
                TextButton(
                    onClick = {
                        // Combine date and time
                        selectedDateMillis?.let { dateMillis ->
                            val dateInstant = Instant.fromEpochMilliseconds(dateMillis)
                            val localDate = dateInstant.toLocalDateTime(timeZone).date
                            
                            val combinedDateTime = LocalDateTime(
                                year = localDate.year,
                                monthNumber = localDate.monthNumber,
                                dayOfMonth = localDate.dayOfMonth,
                                hour = timePickerState.hour,
                                minute = timePickerState.minute,
                                second = 0,
                                nanosecond = 0
                            )
                            
                            val finalInstant = combinedDateTime.toInstant(timeZone)
                            onDateSelected(finalInstant)
                        }
                        onDismiss()
                    }
                ) {
                    Text("Confirm", color = Color(0xFFF5A623))
                }
            },
            dismissButton = {
                TextButton(onClick = onDismiss) {
                    Text("Cancel", color = Color(0xFFA0A0A0))
                }
            },
            text = {
                TimePicker(
                    state = timePickerState,
                    colors = androidx.compose.material3.TimePickerDefaults.colors(
                        clockDialSelectedContentColor = Color.Black,
                        clockDialUnselectedContentColor = Color.White,
                        selectorColor = Color(0xFFF5A623),
                        timeSelectorSelectedContainerColor = Color(0xFFF5A623),
                        timeSelectorSelectedContentColor = Color.Black
                    )
                )
            }
        )
    }
}
