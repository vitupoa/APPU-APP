package com.runinga.feature.contests.presentation.screen.wizard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.runinga.com.core.util.SafeConversion
import com.runinga.feature.contests.presentation.viewmodel.CreateContestState
import com.runinga.feature.contests.presentation.viewmodel.CreateContestViewModel
import com.runinga.feature.contests.presentation.viewmodel.ParticipationType

/**
 * Step 2: Audience Demographics and Team Configuration
 * 
 * Implements:
 * - Subtask 6.1: Demographics lock toggle and conditional age/location fields
 * - Subtask 6.2: Team participation configuration UI
 * 
 * Requirements: 3.1-4.8
 */
@Composable
fun Step2AudienceAndFees(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    val validationErrors = remember(state) { viewModel.validateStep2() }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section 1: Audience Demographics (Subtask 6.1)
        AudienceDemographicsSection(
            viewModel = viewModel,
            state = state,
            validationErrors = validationErrors
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Section 2: Team Participation Configuration (Subtask 6.2)
        TeamParticipationSection(
            viewModel = viewModel,
            state = state,
            validationErrors = validationErrors
        )
    }
}

/**
 * Audience Demographics Section
 * Subtask 6.1: Demographics lock toggle and conditional fields
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
@Composable
private fun AudienceDemographicsSection(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Section Header
        Text(
            text = "Audience Demographics",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        // Demographics Lock Toggle (Requirement 3.1)
        DemographicsLockToggle(
            enabled = state.demographicsLock,
            onToggle = { viewModel.updateDemographicsLock(it) }
        )
        
        // Conditional Age Range Fields (Requirements 3.2, 3.3, 3.4, 3.5)
        if (state.demographicsLock) {
            AgeRangeFields(
                minAge = state.minAge,
                maxAge = state.maxAge,
                onMinAgeChange = { viewModel.updateMinAge(it) },
                onMaxAgeChange = { viewModel.updateMaxAge(it) },
                ageRangeError = validationErrors["ageRange"],
                minAgeError = validationErrors["minAge"],
                maxAgeError = validationErrors["maxAge"]
            )
            
            // Target Locations Field (Requirements 3.2, 3.3)
            TargetLocationsField(
                value = state.targetLocations,
                onValueChange = { viewModel.updateTargetLocations(it) }
            )
        }
    }
}

/**
 * Demographics Lock Toggle Switch
 * Requirement 3.1
 */
@Composable
private fun DemographicsLockToggle(
    enabled: Boolean,
    onToggle: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1F)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Restrict by Demographics",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White
                )
                Text(
                    text = "Limit participation by age and location",
                    fontSize = 12.sp,
                    color = Color(0xFFA0A0A0)
                )
            }
            Switch(
                checked = enabled,
                onCheckedChange = onToggle,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color(0xFFF5A623),
                    checkedTrackColor = Color(0xFFF5A623).copy(alpha = 0.5f),
                    uncheckedThumbColor = Color(0xFF3A3A3F),
                    uncheckedTrackColor = Color(0xFF3A3A3F).copy(alpha = 0.5f)
                )
            )
        }
    }
}

/**
 * Age Range Input Fields
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
@Composable
private fun AgeRangeFields(
    minAge: Int?,
    maxAge: Int?,
    onMinAgeChange: (Int?) -> Unit,
    onMaxAgeChange: (Int?) -> Unit,
    ageRangeError: String?,
    minAgeError: String?,
    maxAgeError: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = "Age Range",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Minimum Age Field
            OutlinedTextField(
                value = minAge?.toString() ?: "",
                onValueChange = { 
                    onMinAgeChange(it.toIntOrNull())
                },
                label = { Text("Min Age") },
                placeholder = { Text("13") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                isError = minAgeError != null || ageRangeError != null,
                modifier = Modifier.weight(1f),
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
            
            // Maximum Age Field
            OutlinedTextField(
                value = maxAge?.toString() ?: "",
                onValueChange = { 
                    onMaxAgeChange(it.toIntOrNull())
                },
                label = { Text("Max Age") },
                placeholder = { Text("65") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                isError = maxAgeError != null || ageRangeError != null,
                modifier = Modifier.weight(1f),
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
        
        // Display validation error
        if (ageRangeError != null) {
            Text(
                text = ageRangeError,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 16.dp)
            )
        } else if (minAgeError != null) {
            Text(
                text = minAgeError,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 16.dp)
            )
        } else if (maxAgeError != null) {
            Text(
                text = maxAgeError,
                color = Color(0xFFFF3B30),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 16.dp)
            )
        }
    }
}

/**
 * Target Locations Input Field
 * Requirements: 3.2, 3.3
 */
@Composable
private fun TargetLocationsField(
    value: String,
    onValueChange: (String) -> Unit
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text("Target Locations") },
        placeholder = { Text("e.g., Kenya, Uganda, Tanzania") },
        supportingText = {
            Text(
                text = "Enter comma-separated locations",
                fontSize = 12.sp,
                color = Color(0xFFA0A0A0)
            )
        },
        singleLine = true,
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
 * Team Participation Configuration Section
 * Subtask 6.2: Participation type selector and conditional team fields
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
@Composable
private fun TeamParticipationSection(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Section Header
        Text(
            text = "Team Participation",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        // Participation Type Selector (Requirements 4.1, 4.2)
        ParticipationTypeSelector(
            selectedType = state.participationType,
            onTypeSelected = { viewModel.updateParticipationType(it) }
        )
        
        // Conditional Team Configuration Fields (Requirements 4.3, 4.4, 4.5, 4.6, 4.7, 4.8)
        if (state.participationType == ParticipationType.TEAM_ONLY || 
            state.participationType == ParticipationType.BOTH) {
            
            TeamConfigurationFields(
                teamSize = state.teamSize,
                maxTeams = state.maxTeams,
                onTeamSizeChange = { viewModel.updateTeamSize(it) },
                onMaxTeamsChange = { viewModel.updateMaxTeams(it) },
                teamSizeError = validationErrors["teamSize"],
                maxTeamsError = validationErrors["maxTeams"]
            )
        }
    }
}

/**
 * Participation Type Selector
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
@Composable
private fun ParticipationTypeSelector(
    selectedType: ParticipationType,
    onTypeSelected: (ParticipationType) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = "Who can participate?",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFA0A0A0)
        )
        
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            ParticipationTypeOption(
                type = ParticipationType.INDIVIDUAL_ONLY,
                label = "Individual Only",
                description = "Only individuals can participate",
                isSelected = selectedType == ParticipationType.INDIVIDUAL_ONLY,
                onSelect = { onTypeSelected(ParticipationType.INDIVIDUAL_ONLY) }
            )
            
            ParticipationTypeOption(
                type = ParticipationType.TEAM_ONLY,
                label = "Team Only",
                description = "Only teams can participate",
                isSelected = selectedType == ParticipationType.TEAM_ONLY,
                onSelect = { onTypeSelected(ParticipationType.TEAM_ONLY) }
            )
            
            ParticipationTypeOption(
                type = ParticipationType.BOTH,
                label = "Both",
                description = "Both individuals and teams can participate",
                isSelected = selectedType == ParticipationType.BOTH,
                onSelect = { onTypeSelected(ParticipationType.BOTH) }
            )
        }
    }
}

/**
 * Single Participation Type Option
 */
@Composable
private fun ParticipationTypeOption(
    type: ParticipationType,
    label: String,
    description: String,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        onClick = onSelect,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) Color(0xFF2A2416) else Color(0xFF1A1A1F)
        ),
        border = BorderStroke(
            width = 2.dp,
            color = if (isSelected) Color(0xFFF5A623) else Color(0xFF3A3A3F)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isSelected) Color(0xFFF5A623) else Color.White
                )
                Text(
                    text = description,
                    fontSize = 12.sp,
                    color = Color(0xFFA0A0A0)
                )
            }
            RadioButton(
                selected = isSelected,
                onClick = onSelect,
                colors = RadioButtonDefaults.colors(
                    selectedColor = Color(0xFFF5A623),
                    unselectedColor = Color(0xFF3A3A3F)
                )
            )
        }
    }
}

/**
 * Team Configuration Fields (conditional)
 * Requirements: 4.5, 4.6, 4.7, 4.8
 */
@Composable
private fun TeamConfigurationFields(
    teamSize: Int?,
    maxTeams: Int?,
    onTeamSizeChange: (Int?) -> Unit,
    onMaxTeamsChange: (Int?) -> Unit,
    teamSizeError: String?,
    maxTeamsError: String?
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Team Size Requirement Field (Requirements 4.5, 4.7)
        OutlinedTextField(
            value = teamSize?.toString() ?: "",
            onValueChange = { 
                onTeamSizeChange(it.toIntOrNull())
            },
            label = { Text("Team Size Requirement (Optional)") },
            placeholder = { Text("e.g., 5") },
            supportingText = {
                if (teamSizeError != null) {
                    Text(
                        text = teamSizeError,
                        color = Color(0xFFFF3B30),
                        fontSize = 12.sp
                    )
                } else {
                    Text(
                        text = "Number of members required (2-10)",
                        fontSize = 12.sp,
                        color = Color(0xFFA0A0A0)
                    )
                }
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            isError = teamSizeError != null,
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
        
        // Max Teams Limit Field (Requirements 4.6, 4.8)
        OutlinedTextField(
            value = maxTeams?.toString() ?: "",
            onValueChange = { 
                onMaxTeamsChange(it.toIntOrNull())
            },
            label = { Text("Maximum Teams Limit (Optional)") },
            placeholder = { Text("e.g., 50") },
            supportingText = {
                if (maxTeamsError != null) {
                    Text(
                        text = maxTeamsError,
                        color = Color(0xFFFF3B30),
                        fontSize = 12.sp
                    )
                } else {
                    Text(
                        text = "Maximum number of teams allowed",
                        fontSize = 12.sp,
                        color = Color(0xFFA0A0A0)
                    )
                }
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            isError = maxTeamsError != null,
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

