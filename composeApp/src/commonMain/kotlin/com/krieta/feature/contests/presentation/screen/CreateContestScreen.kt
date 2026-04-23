package com.krieta.feature.contests.presentation.screen

/**
 * CreateContestScreen - Contest Creation Wizard
 * 
 * A 5-step wizard interface for creating contests with team participation options.
 * 
 * Design System Compliance (Requirements 14.1-14.8):
 * - Yellow Accent (#F5A623): Active states, primary buttons, highlights
 * - Dark Background (#0A0A0F): Main container background
 * - Dark Surface (#1A1A1F): Bottom action bar background
 * - Gray (#3A3A3F): Inactive states, disabled buttons
 * - Rounded Corners: 12dp for buttons and cards
 * - Bold Font Weight: Button text and section headers
 * - Horizontal Padding: 20dp for content areas
 * - Shadow Elevation: 8dp for bottom action bar
 * 
 * Accessibility Features:
 * - Descriptive content descriptions for all interactive elements
 * - High contrast colors for text and backgrounds
 * - Proper focus management for navigation
 * - Clear visual feedback for validation states
 */

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.contests.presentation.viewmodel.CreateContestViewModel
import com.krieta.feature.contests.presentation.screen.wizard.Step1DetailsAndDates
import com.krieta.feature.contests.presentation.screen.wizard.Step2AudienceAndFees
import com.krieta.feature.contests.presentation.screen.wizard.Step3TasksAndConnectors
import com.krieta.feature.contests.presentation.screen.wizard.Step4PrizesAndValidation
import com.krieta.feature.contests.presentation.screen.wizard.Step5ReviewAndJudges
import kotlinx.coroutines.launch

class CreateContestScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<CreateContestViewModel>()
        val state by viewModel.state.collectAsState()
        val scope = rememberCoroutineScope()

        // Task 12.2: Success response handling - close wizard on success (Requirement 13.6)
        LaunchedEffect(state.success) {
            if (state.success) {
                scope.launch {
                    // Show success message
                    navigator.pop()
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            "Create Contest", 
                            fontWeight = FontWeight.Bold, 
                            fontSize = 18.sp,
                            color = Color.White
                        ) 
                    },
                    navigationIcon = {
                        IconButton(
                            onClick = { 
                                if (state.currentStep > 1) viewModel.previousStep() 
                                else navigator.pop()
                            }
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack, 
                                contentDescription = if (state.currentStep > 1) "Go to previous step" else "Close wizard",
                                tint = Color.White
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF0A0A0F),
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White
                    )
                )
            },
            containerColor = Color(0xFF0A0A0F)
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // Progress Indicator
                ProgressIndicator(currentStep = state.currentStep)

                Spacer(modifier = Modifier.height(24.dp))

                // Step Content
                // Step Content with proper weight to fill available space
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    when (state.currentStep) {
                        1 -> Step1DetailsAndDates(viewModel, state)
                        2 -> Step2AudienceAndFees(viewModel, state)
                        3 -> Step3TasksAndConnectors(viewModel, state)
                        4 -> Step4PrizesAndValidation(viewModel, state)
                        5 -> Step5ReviewAndJudges(viewModel, state)
                    }
                }

                // Task 12.2: Error display for backend errors (Requirement 13.7)
                val errorMsg = state.error
                if (errorMsg != null) {
                    ErrorMessageCard(
                        errorMessage = errorMsg,
                        onDismiss = { viewModel.clearError() }
                    )
                }

                // Bottom Action Bar
                BottomActionBar(
                    currentStep = state.currentStep,
                    isValid = viewModel.isCurrentStepValid(),
                    isSubmitting = state.isPublishing,
                    onContinue = { viewModel.nextStep() },
                    onPublish = { viewModel.publishContest() }
                )
            }
        }
    }
}

/**
 * ProgressIndicator - Visual representation of wizard progress
 * 
 * Displays 5 steps with connecting lines, highlighting completed steps.
 * 
 * Design System Compliance:
 * - Active steps: Yellow accent (#F5A623)
 * - Inactive steps: Gray (#3A3A3F)
 * - Bold font weight for active step labels
 * - 20dp horizontal padding
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
@Composable
fun ProgressIndicator(currentStep: Int) {
    val steps = listOf("Details", "Audience", "Tasks", "Prizes", "Review")
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        steps.forEachIndexed { index, label ->
            val stepNumber = index + 1
            val isActive = stepNumber <= currentStep
            val isCurrentStep = stepNumber == currentStep
            
            // Step circle and label
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.wrapContentWidth()
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(if (isActive) Color(0xFFF5A623) else Color(0xFF3A3A3F)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stepNumber.toString(),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isActive) Color.Black else Color(0xFF808080)
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = label,
                    fontSize = 10.sp,
                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                    color = if (isActive) Color(0xFFF5A623) else Color(0xFF808080)
                )
            }
            
            // Connecting line between steps
            if (index < steps.size - 1) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(2.dp)
                        .padding(horizontal = 4.dp)
                        .background(if (stepNumber < currentStep) Color(0xFFF5A623) else Color(0xFF3A3A3F))
                )
            }
        }
    }
}

/**
 * BottomActionBar - Action button for wizard navigation and submission
 * 
 * Displays "Continue" button for steps 1-4 and "Publish Contest" button for step 5.
 * Button is disabled when current step validation fails or during submission.
 * 
 * Design System Compliance:
 * - Container: Dark surface (#1A1A1F)
 * - Active button: Yellow accent (#F5A623) with black text
 * - Disabled button: Gray (#3A3A3F) with gray text (#808080)
 * - Rounded corners: 12dp
 * - Bold font weight for button text
 * - 20dp horizontal padding
 * - 8dp shadow elevation
 * 
 * Requirements: 1.6, 1.7, 1.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8
 */
@Composable
fun BottomActionBar(
    currentStep: Int,
    isValid: Boolean,
    isSubmitting: Boolean,
    onContinue: () -> Unit,
    onPublish: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color(0xFF1A1A1F),
        shadowElevation = 8.dp
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            if (currentStep < 5) {
                Button(
                    onClick = onContinue,
                    enabled = isValid && !isSubmitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFF5A623),
                        disabledContainerColor = Color(0xFF3A3A3F),
                        contentColor = Color.Black,
                        disabledContentColor = Color(0xFF808080)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Continue",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            } else {
                Button(
                    onClick = onPublish,
                    enabled = isValid && !isSubmitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFF5A623),
                        disabledContainerColor = Color(0xFF3A3A3F),
                        contentColor = Color.Black,
                        disabledContentColor = Color(0xFF808080)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (isSubmitting) {
                        Row(
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color.Black,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Publishing...",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    } else {
                        Text(
                            text = "Publish Contest",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

/**
 * ErrorMessageCard - Displays backend error messages
 * 
 * Shows error messages from contest publishing failures with dismiss capability.
 * 
 * Design System Compliance:
 * - Error color: Red (#FF3B30)
 * - Container: Dark surface (#1A1A1F)
 * - Border: Error red
 * - Rounded corners: 12dp
 * - 20dp horizontal padding
 * 
 * Task 12.2: Error response handling with error display (Requirement 13.7)
 */
@Composable
fun ErrorMessageCard(
    errorMessage: String,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1F)
        ),
        border = BorderStroke(2.dp, Color(0xFFFF3B30)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "Error",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFFF3B30)
                )
                Text(
                    text = errorMessage,
                    fontSize = 14.sp,
                    color = Color.White
                )
            }
            
            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Dismiss error",
                    tint = Color(0xFFFF3B30)
                )
            }
        }
    }
}
