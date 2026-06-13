package com.krieta.feature.contests.presentation.screen.wizard
import com.krieta.com.core.util.formatString

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.krieta.feature.contests.presentation.viewmodel.*
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import androidx.compose.foundation.BorderStroke

/**
 * Step 5: Review and Judge Assignment
 * 
 * Implements:
 * - Subtask 9.1: Judge assignment interface (conditional visibility)
 * - Subtask 9.2: Comprehensive review cards display
 * 
 * Requirements: 11.1-12.9
 */
@Composable
fun Step5ReviewAndJudges(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    val validationErrors = remember(state) { viewModel.validateStep5() }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Judge Assignment Section (Subtask 9.1) - Conditional visibility
        // Requirements 11.1, 11.2
        if (state.selectionMethod == SelectionMethod.MANUAL || 
            state.selectionMethod == SelectionMethod.COMBINATION) {
            JudgeAssignmentSection(
                viewModel = viewModel,
                state = state,
                validationErrors = validationErrors
            )
            
            HorizontalDivider(color = Color(0xFF3A3A3F), thickness = 1.dp)
        }
        
        // Review Section Header
        Text(
            text = "Review Your Contest",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        Text(
            text = "Please review all settings before publishing",
            fontSize = 14.sp,
            color = Color(0xFFA0A0A0)
        )
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF1A1A1F)
            ),
            border = BorderStroke(1.dp, Color(0xFFF5A623)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(painterResource(Res.drawable.ic_info), contentDescription = null, tint = Color(0xFFF5A623))
                Text(
                    "Contest funds are held by the platform (not in escrow) until winners are selected. Platform validates contest completion before prize distribution.",
                    fontSize = 12.sp,
                    color = Color.White
                )
            }
        }
        
        // Comprehensive Review Cards (Subtask 9.2)
        ReviewCardsSection(
            viewModel = viewModel,
            state = state
        )
    }
}

/**
 * Judge Assignment Section
 * Subtask 9.1, Requirements 11.1-11.7
 */
@Composable
private fun JudgeAssignmentSection(
    viewModel: CreateContestViewModel,
    state: CreateContestState,
    validationErrors: Map<String, String>
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        Text(
            text = "Assign Judges",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFF5A623)
        )
        
        Text(
            text = "Search and add judges to evaluate submissions (max 15)",
            fontSize = 14.sp,
            color = Color(0xFFA0A0A0)
        )
        
        // Judge Search Interface (Requirements 11.3, 11.4)
        JudgeSearchField(
            viewModel = viewModel,
            state = state
        )
        
        // Judges List (Requirements 11.4, 11.5, 11.6, 11.7)
        JudgesList(
            viewModel = viewModel,
            state = state
        )
        
        // Validation error message
        if (validationErrors["judges"] != null) {
            Text(
                text = validationErrors["judges"]!!,
                color = Color(0xFFFF3B30),
                fontSize = 14.sp,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
        }
    }
}

/**
 * Judge Search Field with real-time user lookup
 * Requirements 11.3, 11.4
 */
@Composable
private fun JudgeSearchField(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(
            value = state.judgeSearchQuery,
            onValueChange = { 
                viewModel.updateJudgeSearchQuery(it)
            },
            label = { Text("Search for users") },
            placeholder = { Text("Enter username...") },
            leadingIcon = {
                Icon(
                    painter = painterResource(Res.drawable.ic_search),
                    contentDescription = "Search",
                    tint = Color(0xFFA0A0A0)
                )
            },
            trailingIcon = {
                if (state.isSearchingJudges) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color(0xFFF5A623),
                        strokeWidth = 2.dp
                    )
                }
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFFF5A623),
                cursorColor = Color(0xFFF5A623),
                focusedLabelColor = Color(0xFFF5A623),
                unfocusedBorderColor = Color(0xFF3A3A3F),
                focusedContainerColor = Color(0xFF1A1A1F),
                unfocusedContainerColor = Color(0xFF1A1A1F),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            shape = RoundedCornerShape(12.dp),
            enabled = state.judges.size < 15 // Requirement 11.5
        )
        
        // Real-time search results
        if (state.judgeSearchQuery.isNotBlank() && state.judges.size < 15) {
            if (state.judgeSearchResults.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF1A1A1F)
                    ),
                    border = BorderStroke(1.dp, Color(0xFF3A3A3F)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        state.judgeSearchResults.take(5).forEach { user ->
                            UserSearchResultItem(
                                user = user,
                                onAddClick = { viewModel.addJudgeFromSearchResult(user) }
                            )
                        }
                    }
                }
            } else if (!state.isSearchingJudges && state.judgeSearchQuery.length >= 2) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF1A1A1F)
                    ),
                    border = BorderStroke(1.dp, Color(0xFF3A3A3F)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "No users found",
                        fontSize = 12.sp,
                        color = Color(0xFFA0A0A0),
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}

/**
 * User Search Result Item with avatar, username, name, and add button
 */
@Composable
private fun UserSearchResultItem(
    user: com.krieta.feature.profile.domain.model.SocialUser,
    onAddClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            // User Avatar
            if (user.avatarUrl != null) {
                AsyncImage(
                    model = user.avatarUrl,
                    contentDescription = "${user.username}'s avatar",
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF3A3A3F)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = user.displayName.firstOrNull()?.uppercase() ?: "?",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
            
            // User Info
            Column(
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = user.displayName,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White
                    )
                    if (user.isVerified) {
                        Icon(
                            painter = painterResource(Res.drawable.ic_check),
                            contentDescription = "Verified",
                            tint = Color(0xFF0A84FF),
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
                Text(
                    text = "@${user.username}",
                    fontSize = 12.sp,
                    color = Color(0xFFA0A0A0)
                )
            }
        }
        
        // Add Button
        IconButton(
            onClick = onAddClick,
            modifier = Modifier.size(36.dp)
        ) {
            Icon(
                painter = painterResource(Res.drawable.ic_add),
                contentDescription = "Add as judge",
                tint = Color(0xFFF5A623)
            )
        }
    }
}

/**
 * Judges List with add/remove capabilities
 * Requirements 11.4, 11.5, 11.6, 11.7
 */
@Composable
private fun JudgesList(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // Judges count indicator
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Assigned Judges",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFFA0A0A0)
            )
            
            Text(
                text = "${state.judges.size}/15",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = if (state.judges.size >= 15) Color(0xFFFF3B30) else Color(0xFFF5A623)
            )
        }
        
        // Judges list
        if (state.judges.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF1A1A1F)
                ),
                border = BorderStroke(1.dp, Color(0xFF3A3A3F)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No judges assigned yet",
                        fontSize = 14.sp,
                        color = Color(0xFFA0A0A0)
                    )
                }
            }
        } else {
            state.judges.forEach { judge ->
                JudgeListItem(
                    judge = judge,
                    onRemove = { viewModel.removeJudge(judge) }
                )
            }
        }
    }
}

/**
 * Single Judge List Item with avatar and remove button
 * Requirements 11.6, 11.7
 */
@Composable
private fun JudgeListItem(
    judge: Judge,
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
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                // Judge Avatar
                if (judge.avatarUrl != null) {
                    AsyncImage(
                        model = judge.avatarUrl,
                        contentDescription = "${judge.username}'s avatar",
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF3A3A3F)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = judge.displayName.firstOrNull()?.uppercase() ?: "?",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                
                // Judge Info
                Column {
                    Text(
                        text = judge.displayName,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White
                    )
                    Text(
                        text = "@${judge.username}",
                        fontSize = 12.sp,
                        color = Color(0xFFA0A0A0)
                    )
                }
            }
            
            IconButton(
                onClick = onRemove,
                colors = IconButtonDefaults.iconButtonColors(
                    contentColor = Color(0xFFFF3B30)
                )
            ) {
                Icon(
                    painter = painterResource(Res.drawable.ic_close),
                    contentDescription = "Remove judge"
                )
            }
        }
    }
}

/**
 * Review Cards Section
 * Subtask 9.2, Requirements 12.1-12.9
 */
@Composable
private fun ReviewCardsSection(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Requirement 12.1: Contest Details
        ContestDetailsReviewCard(state)
        
        // Requirement 12.2: Dates and Duration
        DatesAndDurationReviewCard(state)
        
        // Requirement 12.3: Participation Type and Team Configuration
        ParticipationReviewCard(state)
        
        // Requirement 12.4: Demographics and Targeting
        if (state.demographicsLock) {
            DemographicsReviewCard(state)
        }
        
        // Requirement 12.5: Entry Fee or Paid Voting
        EntryFeeReviewCard(viewModel, state)
        
        // Requirement 12.6: Tasks List
        TasksReviewCard(state)
        
        // Requirement 12.7: Prize Distribution and Selection Method
        PrizesReviewCard(viewModel, state)
        
        // Requirement 12.8: Judge Assignments
        if (state.selectionMethod == SelectionMethod.MANUAL || 
            state.selectionMethod == SelectionMethod.COMBINATION) {
            JudgesReviewCard(state)
        }
        
        // Requirement 12.9: Milestone Airdrop
        if (state.milestoneAirdropEnabled) {
            MilestoneAirdropReviewCard(viewModel, state)
        }
    }
}

/**
 * Contest Details Review Card
 * Requirement 12.1
 */
@Composable
private fun ContestDetailsReviewCard(state: CreateContestState) {
    ReviewCard(title = "Contest Details") {
        ReviewItem(label = "Title", value = state.title)
        ReviewItem(label = "Description", value = state.description)
        if (state.rules.isNotBlank()) {
            ReviewItem(label = "Rules", value = state.rules)
        }
        if (state.exampleContentUrl.isNotBlank()) {
            ReviewItem(label = "Example Content URL", value = state.exampleContentUrl)
        }
    }
}

/**
 * Dates and Duration Review Card
 * Requirement 12.2
 */
@Composable
private fun DatesAndDurationReviewCard(state: CreateContestState) {
    ReviewCard(title = "Schedule") {
        state.startDate?.let { startDate ->
            val localDateTime = startDate.toLocalDateTime(TimeZone.currentSystemDefault())
            ReviewItem(
                label = "Start Date",
                value = "${localDateTime.date} at ${localDateTime.time}"
            )
        }
        
        state.endDate?.let { endDate ->
            val localDateTime = endDate.toLocalDateTime(TimeZone.currentSystemDefault())
            ReviewItem(
                label = "End Date",
                value = "${localDateTime.date} at ${localDateTime.time}"
            )
        }
        
        state.duration?.let { duration ->
            val hours = duration.inWholeHours
            val days = hours / 24
            val remainingHours = hours % 24
            val durationText = when {
                days > 0 -> "$days day${if (days > 1) "s" else ""} $remainingHours hour${if (remainingHours != 1L) "s" else ""}"
                else -> "$hours hour${if (hours != 1L) "s" else ""}"
            }
            ReviewItem(label = "Duration", value = durationText)
        }
    }
}

/**
 * Participation Type and Team Configuration Review Card
 * Requirement 12.3
 */
@Composable
private fun ParticipationReviewCard(state: CreateContestState) {
    ReviewCard(title = "Participation") {
        val participationTypeLabel = when (state.participationType) {
            ParticipationType.INDIVIDUAL_ONLY -> "Individual Only"
            ParticipationType.TEAM_ONLY -> "Team Only"
            ParticipationType.BOTH -> "Individual & Team"
        }
        ReviewItem(label = "Type", value = participationTypeLabel)
        
        // Show team configuration only when applicable
        if (state.participationType == ParticipationType.TEAM_ONLY || 
            state.participationType == ParticipationType.BOTH) {
            state.teamSize?.let { teamSize ->
                ReviewItem(label = "Team Size", value = "$teamSize members")
            }
            state.maxTeams?.let { maxTeams ->
                ReviewItem(label = "Max Teams", value = "$maxTeams teams")
            }
        }
    }
}

/**
 * Demographics and Targeting Review Card
 * Requirement 12.4
 */
@Composable
private fun DemographicsReviewCard(state: CreateContestState) {
    ReviewCard(title = "Demographics & Targeting") {
        if (state.minAge != null && state.maxAge != null) {
            ReviewItem(label = "Age Range", value = "${state.minAge} - ${state.maxAge} years")
        }
        if (state.targetLocations.isNotBlank()) {
            ReviewItem(label = "Target Locations", value = state.targetLocations)
        }
    }
}

/**
 * Entry Fee or Paid Voting Review Card
 * Requirement 12.5
 */
@Composable
private fun EntryFeeReviewCard(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    ReviewCard(title = "Entry & Voting") {
        if (state.entryFee > 0.0) {
            val currencyCode = viewModel.getCurrencyCode()
            val krDisplay = viewModel.getEntryFeeKrDisplay()
            ReviewItem(
                label = "Entry Fee",
                value = "$currencyCode ${formatString("%.2f", state.entryFee)} (≈ $krDisplay)"
            )
        } else {
            ReviewItem(label = "Entry Fee", value = "Free")
        }
        
        ReviewItem(
            label = "Paid Voting",
            value = if (state.paidVoting) "Enabled" else "Disabled"
        )
    }
}

/**
 * Tasks List Review Card
 * Requirement 12.6
 */
@Composable
private fun TasksReviewCard(state: CreateContestState) {
    ReviewCard(title = "Required Tasks") {
        if (state.addedTasks.isEmpty()) {
            Text(
                text = "No tasks added",
                fontSize = 14.sp,
                color = Color(0xFFA0A0A0)
            )
        } else {
            state.addedTasks.forEachIndexed { index, task ->
                val taskLabel = getTaskTypeLabel(task.type)
                ReviewItem(
                    label = "${index + 1}. $taskLabel",
                    value = task.data
                )
            }
        }
    }
}

/**
 * Prize Distribution and Selection Method Review Card
 * Requirement 12.7
 */
@Composable
private fun PrizesReviewCard(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    ReviewCard(title = "Prizes & Selection") {
        val currencyCode = viewModel.getCurrencyCode()
        
        // Prize distribution
        val prizeLabels = listOf("1st Place", "2nd Place", "3rd Place")
        state.prizeAmounts.forEachIndexed { index, amount ->
            if (index < state.winnerSlots) {
                val krDisplay = viewModel.getPrizeKrDisplay(amount)
                ReviewItem(
                    label = prizeLabels[index],
                    value = "$currencyCode ${formatString("%.2f", amount)} (≈ $krDisplay)"
                )
            }
        }
        
        // Total prize pool
        val totalKrDisplay = viewModel.getTotalPrizePoolKrDisplay()
        ReviewItem(
            label = "Total Prize Pool",
            value = "$currencyCode ${formatString("%.2f", state.totalPrizePool)} (≈ $totalKrDisplay)",
            highlighted = true
        )
        
        // Selection method
        val selectionMethodLabel = when (state.selectionMethod) {
            SelectionMethod.MANUAL -> "Manual Selection"
            SelectionMethod.RANDOM -> "Random Selection"
            SelectionMethod.VOTING -> "Community Voting"
            SelectionMethod.COMBINATION -> "Combination (Judges + Voting)"
        }
        ReviewItem(label = "Selection Method", value = selectionMethodLabel)
    }
}

/**
 * Judge Assignments Review Card
 * Requirement 12.8
 */
@Composable
private fun JudgesReviewCard(state: CreateContestState) {
    ReviewCard(title = "Assigned Judges") {
        if (state.judges.isEmpty()) {
            Text(
                text = "No judges assigned",
                fontSize = 14.sp,
                color = Color(0xFFA0A0A0)
            )
        } else {
            state.judges.forEachIndexed { index, judge ->
                ReviewItem(
                    label = "${index + 1}. ${judge.displayName}",
                    value = "@${judge.username}"
                )
            }
        }
    }
}

/**
 * Milestone Airdrop Review Card
 * Requirement 12.9
 */
@Composable
private fun MilestoneAirdropReviewCard(
    viewModel: CreateContestViewModel,
    state: CreateContestState
) {
    ReviewCard(title = "Milestone Airdrop") {
        ReviewItem(
            label = "Kr per Participant",
            value = viewModel.formatKr(state.milestoneAirdropAmount)
        )
        ReviewItem(
            label = "Participant Limit",
            value = "${state.milestoneAirdropLimit} participants"
        )
        
        val totalAirdrop = state.milestoneAirdropAmount * state.milestoneAirdropLimit
        ReviewItem(
            label = "Total Airdrop Budget",
            value = viewModel.formatKr(totalAirdrop),
            highlighted = true
        )
    }
}

/**
 * Reusable Review Card Component
 */
@Composable
private fun ReviewCard(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1F)
        ),
        border = BorderStroke(1.dp, Color(0xFF3A3A3F)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFF5A623)
            )
            
            HorizontalDivider(color = Color(0xFF3A3A3F), thickness = 1.dp)
            
            content()
        }
    }
}

/**
 * Reusable Review Item Component
 */
@Composable
private fun ReviewItem(
    label: String,
    value: String,
    highlighted: Boolean = false
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = label,
            fontSize = 12.sp,
            color = Color(0xFFA0A0A0)
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = if (highlighted) FontWeight.Bold else FontWeight.Normal,
            color = if (highlighted) Color(0xFFF5A623) else Color.White
        )
    }
}

/**
 * Helper function to get human-readable task type labels
 */
private fun getTaskTypeLabel(type: TaskType): String {
    return when (type) {
        TaskType.FOLLOW_KRIETA -> "Follow on Krieta"
        TaskType.SUBSCRIBE_YOUTUBE -> "Subscribe on YouTube"
        TaskType.FOLLOW_SPOTIFY -> "Follow on Spotify"
        TaskType.FOLLOW_INSTAGRAM -> "Follow on Instagram"
        TaskType.FOLLOW_TIKTOK -> "Follow on TikTok"
        TaskType.WATCH_VIDEO -> "Watch Video"
        TaskType.VISIT_SHOP -> "Visit Shop"
        TaskType.CUSTOM_TASK -> "Custom Task"
    }
}



