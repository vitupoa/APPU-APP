package com.krieta.feature.contests.presentation.screen.wizard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.interop.UIKitView
import androidx.compose.ui.unit.dp
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.datetime.Instant
import kotlinx.datetime.toNSDate
import platform.Foundation.NSDate
import platform.Foundation.timeIntervalSince1970
import platform.UIKit.UIDatePicker
import platform.UIKit.UIDatePickerMode

/**
 * iOS implementation of DateTimePicker using UIDatePicker
 * 
 * Requirements: 2.4, 2.5
 */
@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun DateTimePicker(
    currentDate: Instant?,
    onDateSelected: (Instant?) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedDate by remember { mutableStateOf(currentDate) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    onDateSelected(selectedDate)
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
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            ) {
                UIKitView(
                    factory = {
                        UIDatePicker().apply {
                            datePickerMode = UIDatePickerMode.UIDatePickerModeDateAndTime
                            preferredDatePickerStyle = platform.UIKit.UIDatePickerStyle.UIDatePickerStyleWheels
                            
                            // Set initial date
                            currentDate?.let { instant ->
                                date = instant.toNSDate()
                            }
                            
                            // Add target for value changes
                            addTarget(
                                target = null,
                                action = null,
                                forControlEvents = platform.UIKit.UIControlEventValueChanged
                            )
                        }
                    },
                    update = { picker ->
                        // Update selected date when picker changes
                        val nsDate = picker.date
                        val timeInterval = nsDate.timeIntervalSince1970
                        selectedDate = Instant.fromEpochSeconds(timeInterval.toLong())
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        },
        containerColor = Color(0xFF1A1A1F),
        shape = RoundedCornerShape(12.dp)
    )
}
