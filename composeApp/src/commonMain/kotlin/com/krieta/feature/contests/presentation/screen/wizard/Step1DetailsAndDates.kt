package com.krieta.feature.contests.presentation.screen.wizard

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krieta.feature.contests.presentation.viewmodel.CreateContestState
import com.krieta.feature.contests.presentation.viewmodel.CreateContestViewModel
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import coil3.compose.AsyncImage
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerType
import kotlinx.coroutines.launch

/**
 * Step 1: Contest Details and Dates
 * 
 * Implements:
 * - Subtask 5.1: Title, description, rules, and example content URL input fields
 * - Subtask 5.2: Native date/time pickers for start and end dates with duration calculation
 * 
 * Requirements: 2.1-2.10
 */
@Composable
fun Step1DetailsAndDates(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    val validationErrors = remember(state) { viewModel.validateStep1() }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        Text(
            text = "Contest Details",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        // Cover Image Upload (Optional)
        CoverImageUpload(
            coverImageFile = state.coverImageFile,
            onImageSelected = { file -> viewModel.setCoverImage(file) },
            onImageRemoved = { viewModel.setCoverImage(null) }
        )
        
        // Title Input Field (Requirements 2.1, 2.9)
        TitleInputField(
            value = state.title,
            onValueChange = { viewModel.updateTitle(it) },
            error = validationErrors["title"]
        )
        
        // Description Input Field (Requirements 2.2, 2.10)
        DescriptionInputField(
            value = state.description,
            onValueChange = { viewModel.updateDescription(it) },
            error = validationErrors["description"]
        )
        
        // Rules Input Field (Requirement 2.3)
        RulesInputField(
            value = state.rules,
            onValueChange = { viewModel.updateRules(it) }
        )
        
        // Example Content URL Input Field (Requirement 2.8)
        ExampleContentUrlInputField(
            value = state.exampleContentUrl,
            onValueChange = { viewModel.updateExampleContentUrl(it) }
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Section Header
        Text(
            text = "Contest Schedule",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        // Start Date Picker (Requirements 2.4)
        DateTimePickerField(
            label = "Start Date & Time",
            selectedDate = state.startDate,
            onDateSelected = { viewModel.updateStartDate(it) },
            error = validationErrors["startDate"]
        )
        
        // End Date Picker (Requirements 2.5)
        DateTimePickerField(
            label = "End Date & Time",
            selectedDate = state.endDate,
            onDateSelected = { viewModel.updateEndDate(it) },
            error = validationErrors["endDate"] ?: validationErrors["duration"]
        )
        
        // Duration Display (Requirements 2.6, 2.7)
        if (state.startDate != null && state.endDate != null) {
            DurationDisplay(
                duration = state.duration,
                isValid = validationErrors["duration"] == null
            )
        }
    }
}

/**
 * Title input field with character count (3-80 chars)
 * Requirements: 2.1, 2.9
 */
@Composable
private fun TitleInputField(
    value: String,
    onValueChange: (String) -> Unit,
    error: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text("Contest Title") },
            placeholder = { Text("Enter a catchy title") },
            supportingText = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (error != null) {
                        Text(
                            text = error,
                            color = Color(0xFFFF3B30),
                            fontSize = 12.sp
                        )
                    } else {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                    Text(
                        text = "${value.length}/80",
                        color = if (value.length in 3..80) Color(0xFF34C759) else Color(0xFFA0A0A0),
                        fontSize = 12.sp
                    )
                }
            },
            isError = error != null,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFFF5A623),
                cursorColor = Color(0xFFF5A623),
                focusedLabelColor = Color(0xFFF5A623),
                unfocusedBorderColor = Color(0xFF3A3A3F),
                errorBorderColor = Color(0xFFFF3B30),
                focusedContainerColor = Color(0xFF1A1A1F),
                unfocusedContainerColor = Color(0xFF1A1A1F)
            ),
            shape = RoundedCornerShape(12.dp)
        )
    }
}

/**
 * Description multiline input field (min 10 chars)
 * Requirements: 2.2, 2.10
 */
@Composable
private fun DescriptionInputField(
    value: String,
    onValueChange: (String) -> Unit,
    error: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text("Description") },
            placeholder = { Text("Describe what participants need to do") },
            supportingText = {
                if (error != null) {
                    Text(
                        text = error,
                        color = Color(0xFFFF3B30),
                        fontSize = 12.sp
                    )
                }
            },
            isError = error != null,
            minLines = 3,
            maxLines = 6,
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = com.krieta.com.core.ui.components.HashtagVisualTransformation(Color(0xFFF5A623)),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFFF5A623),
                cursorColor = Color(0xFFF5A623),
                focusedLabelColor = Color(0xFFF5A623),
                unfocusedBorderColor = Color(0xFF3A3A3F),
                errorBorderColor = Color(0xFFFF3B30),
                focusedContainerColor = Color(0xFF1A1A1F),
                unfocusedContainerColor = Color(0xFF1A1A1F)
            ),
            shape = RoundedCornerShape(12.dp)
        )
    }
}

/**
 * Optional rules multiline input field
 * Requirement: 2.3
 */
@Composable
private fun RulesInputField(
    value: String,
    onValueChange: (String) -> Unit
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text("Specific Rules (Optional)") },
        placeholder = { Text("Add any specific rules or guidelines") },
        minLines = 2,
        maxLines = 4,
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Color(0xFFF5A623),
            cursorColor = Color(0xFFF5A623),
            focusedLabelColor = Color(0xFFF5A623),
            unfocusedBorderColor = Color(0xFF3A3A3F),
            focusedContainerColor = Color(0xFF1A1A1F),
            unfocusedContainerColor = Color(0xFF1A1A1F)
        ),
        shape = RoundedCornerShape(12.dp)
    )
}

/**
 * Optional example content URL input field
 * Requirement: 2.8
 */
@Composable
private fun ExampleContentUrlInputField(
    value: String,
    onValueChange: (String) -> Unit
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text("Example Content URL (Optional)") },
        placeholder = { Text("https://example.com/sample") },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Color(0xFFF5A623),
            cursorColor = Color(0xFFF5A623),
            focusedLabelColor = Color(0xFFF5A623),
            unfocusedBorderColor = Color(0xFF3A3A3F),
            focusedContainerColor = Color(0xFF1A1A1F),
            unfocusedContainerColor = Color(0xFF1A1A1F)
        ),
        shape = RoundedCornerShape(12.dp)
    )
}

/**
 * Date and time picker field with platform-specific picker
 * Requirements: 2.4, 2.5
 */
@Composable
private fun DateTimePickerField(
    label: String,
    selectedDate: Instant?,
    onDateSelected: (Instant?) -> Unit,
    error: String?
) {
    var showPicker by remember { mutableStateOf(false) }
    
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        // Date/Time display button
        OutlinedButton(
            onClick = { showPicker = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = Color(0xFF1A1A1F),
                contentColor = if (selectedDate != null) Color.White else Color(0xFFA0A0A0)
            ),
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (error != null) Color(0xFFFF3B30) else Color(0xFF3A3A3F)
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = label,
                    fontSize = 14.sp,
                    color = Color(0xFFA0A0A0)
                )
                Text(
                    text = selectedDate?.let { formatDateTime(it) } ?: "Select date & time",
                    fontSize = 14.sp,
                    fontWeight = if (selectedDate != null) FontWeight.Medium else FontWeight.Normal
                )
            }
        }
        
        if (error != null) {
            Text(
                text = error,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 16.dp)
            )
        }
    }
    
    // Show platform-specific date/time picker
    if (showPicker) {
        DateTimePicker(
            currentDate = selectedDate,
            onDateSelected = onDateSelected,
            onDismiss = { showPicker = false }
        )
    }
}

/**
 * Duration display showing calculated contest duration
 * Requirements: 2.6, 2.7
 */
@Composable
private fun DurationDisplay(
    duration: kotlin.time.Duration?,
    isValid: Boolean
) {
    if (duration != null) {
        val hours = duration.inWholeHours
        val days = hours / 24
        val remainingHours = hours % 24
        
        val durationText = when {
            days > 0 -> "$days day${if (days > 1) "s" else ""} $remainingHours hour${if (remainingHours != 1L) "s" else ""}"
            else -> "$hours hour${if (hours != 1L) "s" else ""}"
        }
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = if (isValid) Color(0xFF0A2912) else Color(0xFF330C0A)
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Contest Duration:",
                    fontSize = 14.sp,
                    color = Color(0xFFA0A0A0)
                )
                Text(
                    text = durationText,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isValid) Color(0xFF34C759) else Color(0xFFFF3B30)
                )
            }
        }
    }
}

/**
 * Format Instant to readable date/time string
 */
private fun formatDateTime(instant: Instant): String {
    val localDateTime = instant.toLocalDateTime(TimeZone.currentSystemDefault())
    return "${localDateTime.date} ${localDateTime.hour.toString().padStart(2, '0')}:${localDateTime.minute.toString().padStart(2, '0')}"
}

/**
 * Cover Image Upload Component
 * Uses FileKit's rememberFilePickerLauncher for cross-platform image picking (Android + iOS)
 */
@Composable
private fun CoverImageUpload(
    coverImageFile: io.github.vinceglb.filekit.core.PlatformFile?,
    onImageSelected: (io.github.vinceglb.filekit.core.PlatformFile) -> Unit,
    onImageRemoved: () -> Unit
) {
    val launcher = rememberFilePickerLauncher(
        type = PickerType.Image
    ) { file ->
        file?.let {
            onImageSelected(it)
        }
    }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = "Cover Image (Optional)",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        if (coverImageFile != null) {
            // Show selected image with remove button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF1A1A1F))
            ) {
                // Display the image
                AsyncImage(
                    model = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(coverImageFile),
                    contentDescription = "Contest cover image",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                
                // Remove button
                IconButton(
                    onClick = onImageRemoved,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(32.dp)
                        .background(Color.Black.copy(alpha = 0.6f), CircleShape)
                ) {
                    Icon(
                        painter = painterResource(Res.drawable.ic_close),
                        contentDescription = "Remove image",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        } else {
            // Show image picker button — launches native file picker on tap
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF1A1A1F))
                    .border(
                        width = 2.dp,
                        color = Color(0xFF3A3A3F),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .clickable { launcher.launch() },
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        painter = painterResource(Res.drawable.ic_add),
                        contentDescription = "Add cover image",
                        tint = Color(0xFFF5A623),
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = "Tap to add cover image",
                        fontSize = 14.sp,
                        color = Color(0xFFA0A0A0)
                    )
                }
            }
        }
    }
}


