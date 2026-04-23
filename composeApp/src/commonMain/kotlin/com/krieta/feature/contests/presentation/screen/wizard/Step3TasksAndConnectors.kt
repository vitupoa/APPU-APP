package com.krieta.feature.contests.presentation.screen.wizard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krieta.feature.contests.presentation.viewmodel.CreateContestState
import com.krieta.feature.contests.presentation.viewmodel.CreateContestViewModel
import com.krieta.feature.contests.presentation.viewmodel.TaskConfiguration
import com.krieta.feature.contests.presentation.viewmodel.TaskType

/**
 * Step 3: Tasks and Connectors
 * 
 * Implements:
 * - Subtask 7.1: Task type selector with 8 options and type-specific input fields
 * - Subtask 7.2: Task list management UI with add/remove functionality
 * 
 * Requirements: 6.1-6.14
 */
@Composable
fun Step3TasksAndConnectors(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    val validationErrors = remember(state) { viewModel.validateStep3() }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        Text(
            text = "Contest Tasks",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        Text(
            text = "Add tasks that participants must complete to enter the contest",
            fontSize = 14.sp,
            color = Color(0xFFA0A0A0)
        )
        
        // Task Type Selector (Subtask 7.1, Requirements 6.1)
        TaskTypeSelector(
            selectedType = state.taskType,
            onTypeSelected = { viewModel.updateTaskType(it) }
        )
        
        // Type-Specific Input Field (Subtask 7.1, Requirements 6.2-6.9)
        TaskConfigurationInput(
            taskType = state.taskType,
            value = state.taskConfiguration,
            onValueChange = { viewModel.updateTaskConfiguration(it) },
            error = validationErrors["taskConfiguration"]
        )
        
        // Add Task Button (Subtask 7.2, Requirements 6.10, 6.11)
        AddTaskButton(
            enabled = state.taskConfiguration.isNotBlank(),
            onClick = { viewModel.addTask() }
        )
        
        // Added Tasks List (Subtask 7.2, Requirements 6.12, 6.13)
        if (state.addedTasks.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Added Tasks (${state.addedTasks.size})",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White
            )
            
            AddedTasksList(
                tasks = state.addedTasks,
                onRemoveTask = { viewModel.removeTask(it) }
            )
        }
        
        // Validation Error (Subtask 7.2, Requirement 6.14)
        if (validationErrors["taskList"] != null) {
            Text(
                text = validationErrors["taskList"]!!,
                color = Color(0xFFFF3B30),
                fontSize = 14.sp,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }
    }
}

/**
 * Task Type Selector with 8 options
 * Subtask 7.1, Requirement 6.1
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TaskTypeSelector(
    selectedType: TaskType,
    onTypeSelected: (TaskType) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = "Task Type",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = it }
        ) {
            OutlinedTextField(
                value = getTaskTypeLabel(selectedType),
                onValueChange = {},
                readOnly = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFF5A623),
                    unfocusedBorderColor = Color(0xFF3A3A3F),
                    focusedContainerColor = Color(0xFF1A1A1F),
                    unfocusedContainerColor = Color(0xFF1A1A1F),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp)
            )
            
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.exposedDropdownSize()
            ) {
                TaskType.entries.forEach { taskType ->
                    DropdownMenuItem(
                        text = { 
                            Text(
                                text = getTaskTypeLabel(taskType),
                                color = if (taskType == selectedType) Color(0xFFF5A623) else Color.White
                            )
                        },
                        onClick = {
                            onTypeSelected(taskType)
                            expanded = false
                        },
                        colors = MenuDefaults.itemColors(
                            textColor = Color.White
                        )
                    )
                }
            }
        }
    }
}

/**
 * Type-specific input field based on selected task type
 * Subtask 7.1, Requirements 6.2-6.9
 */
@Composable
private fun TaskConfigurationInput(
    taskType: TaskType,
    value: String,
    onValueChange: (String) -> Unit,
    error: String?
) {
    val (label, placeholder, keyboardType) = when (taskType) {
        TaskType.FOLLOW_KRIETA -> Triple(
            "Krieta Username",
            "Enter username to follow",
            KeyboardType.Text
        )
        TaskType.SUBSCRIBE_YOUTUBE -> Triple(
            "YouTube Channel URL",
            "https://youtube.com/@channel",
            KeyboardType.Uri
        )
        TaskType.FOLLOW_SPOTIFY -> Triple(
            "Spotify Artist URL",
            "https://open.spotify.com/artist/...",
            KeyboardType.Uri
        )
        TaskType.FOLLOW_INSTAGRAM -> Triple(
            "Instagram Username",
            "@username",
            KeyboardType.Text
        )
        TaskType.FOLLOW_TIKTOK -> Triple(
            "TikTok Username",
            "@username",
            KeyboardType.Text
        )
        TaskType.WATCH_VIDEO -> Triple(
            "Video URL",
            "https://youtube.com/watch?v=...",
            KeyboardType.Uri
        )
        TaskType.VISIT_SHOP -> Triple(
            "Shop URL",
            "https://shop.example.com",
            KeyboardType.Uri
        )
        TaskType.CUSTOM_TASK -> Triple(
            "Custom Task Description",
            "Describe what participants need to do",
            KeyboardType.Text
        )
    }
    
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            singleLine = taskType != TaskType.CUSTOM_TASK,
            minLines = if (taskType == TaskType.CUSTOM_TASK) 2 else 1,
            maxLines = if (taskType == TaskType.CUSTOM_TASK) 4 else 1,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            isError = error != null,
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
        
        // Inline error message display (Requirement 15.1)
        if (error != null) {
            Text(
                text = error,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 16.dp)
            )
        }
    }
}

/**
 * Add Task Button
 * Subtask 7.2, Requirements 6.10, 6.11
 */
@Composable
private fun AddTaskButton(
    enabled: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xFFF5A623),
            contentColor = Color(0xFF0A0A0F),
            disabledContainerColor = Color(0xFF3A3A3F),
            disabledContentColor = Color(0xFFA0A0A0)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = "Add Task",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 8.dp)
        )
    }
}

/**
 * List of added tasks with remove functionality
 * Subtask 7.2, Requirements 6.12, 6.13
 */
@Composable
private fun AddedTasksList(
    tasks: List<TaskConfiguration>,
    onRemoveTask: (TaskConfiguration) -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        tasks.forEach { task ->
            TaskListItem(
                task = task,
                onRemove = { onRemoveTask(task) }
            )
        }
    }
}

/**
 * Single task list item with remove button
 * Subtask 7.2, Requirements 6.12, 6.13
 */
@Composable
private fun TaskListItem(
    task: TaskConfiguration,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1F)
        ),
        border = BorderStroke(1.dp, Color(0xFF3A3A3F)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = getTaskTypeLabel(task.type),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFF5A623)
                )
                Text(
                    text = task.data,
                    fontSize = 14.sp,
                    color = Color.White
                )
            }
            
            IconButton(
                onClick = onRemove,
                colors = IconButtonDefaults.iconButtonColors(
                    contentColor = Color(0xFFFF3B30)
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Remove task"
                )
            }
        }
    }
}

/**
 * Helper function to get human-readable task type labels
 */
private fun getTaskTypeLabel(taskType: TaskType): String {
    return when (taskType) {
        TaskType.FOLLOW_KRIETA -> "Follow Krieta"
        TaskType.SUBSCRIBE_YOUTUBE -> "Subscribe YouTube"
        TaskType.FOLLOW_SPOTIFY -> "Follow Spotify"
        TaskType.FOLLOW_INSTAGRAM -> "Follow Instagram"
        TaskType.FOLLOW_TIKTOK -> "Follow TikTok"
        TaskType.WATCH_VIDEO -> "Watch Video"
        TaskType.VISIT_SHOP -> "Visit Shop"
        TaskType.CUSTOM_TASK -> "Custom Task"
    }
}
