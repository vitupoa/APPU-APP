# Contest Creation Wizard - Integration Guide

## Quick Start

The Contest Creation Wizard backend integration is now complete. This guide shows you how to use and test the publishing functionality.

## How It Works

### User Flow
1. User completes all 5 steps of the wizard
2. User clicks "Publish Contest" on step 5
3. System validates all steps
4. System constructs payload from wizard state
5. System sends POST request to `/api/v1/contests`
6. System handles response (success or error)

### Success Flow
```
User clicks "Publish Contest"
  ↓
Button shows "Publishing..." with spinner
  ↓
Backend returns HTTP 201
  ↓
Wizard automatically closes
  ↓
User returns to previous screen
```

### Error Flow
```
User clicks "Publish Contest"
  ↓
Button shows "Publishing..." with spinner
  ↓
Backend returns HTTP 4xx/5xx
  ↓
Error message appears below content
  ↓
User can dismiss error and retry
  ↓
User remains on step 5
```

## Key Components

### 1. CreateContestViewModel.publishContest()
**Location**: `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/presentation/viewmodel/CreateContestViewModel.kt`

**Purpose**: Constructs payload and submits contest to backend

**Usage**:
```kotlin
val viewModel = koinScreenModel<CreateContestViewModel>()
viewModel.publishContest()
```

**What it does**:
- Validates all wizard steps
- Constructs comprehensive payload
- Converts wizard data to backend format
- Sends POST request to `/api/v1/contests`
- Updates state with success/error

### 2. CreateContestState.isPublishing
**Location**: `CreateContestViewModel.kt` (line ~116)

**Purpose**: Tracks loading state during submission

**Usage**:
```kotlin
val state by viewModel.state.collectAsState()
if (state.isPublishing) {
    // Show loading indicator
}
```

### 3. CreateContestState.success
**Location**: `CreateContestViewModel.kt` (line ~127)

**Purpose**: Indicates successful contest creation

**Usage**:
```kotlin
LaunchedEffect(state.success) {
    if (state.success) {
        // Close wizard
        navigator.pop()
    }
}
```

### 4. CreateContestState.error
**Location**: `CreateContestViewModel.kt` (line ~128)

**Purpose**: Contains error message from backend

**Usage**:
```kotlin
if (state.error != null) {
    ErrorMessageCard(
        errorMessage = state.error,
        onDismiss = { viewModel.clearError() }
    )
}
```

### 5. ErrorMessageCard
**Location**: `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/presentation/screen/CreateContestScreen.kt`

**Purpose**: Displays error messages with dismiss capability

**Usage**:
```kotlin
ErrorMessageCard(
    errorMessage = "Failed to publish contest",
    onDismiss = { viewModel.clearError() }
)
```

## Payload Structure

The `publishContest()` function constructs a payload with the following fields:

```kotlin
CreateContestRequestDto(
    // Step 1: Contest Details
    title = "My Contest",
    description = "Contest description",
    
    // Step 1: Dates
    deadline = "2024-12-31T23:59:59Z",
    
    // Step 2: Participation Type (NEW)
    participationType = "INDIVIDUAL_ONLY" | "TEAM_ONLY" | "BOTH",
    teamSize = 5,  // Optional: 2-10 members
    maxTeams = 10, // Optional: positive integer
    
    // Step 2: Entry Fee
    // (Converted to Kr)
    
    // Step 3: Tasks
    requiredActions = [
        RequiredActionDto(
            type = "FOLLOW_KRIETA",
            targetUrl = "@username",
            label = "@username"
        )
    ],
    
    // Step 4: Prizes
    prizeKr = 1000.0, // Total prize pool in Kr
    maxWinners = 3,
    prizeDistribution = [
        PrizeDistributionDto(rank = 1, percentage = 50.0),
        PrizeDistributionDto(rank = 2, percentage = 30.0),
        PrizeDistributionDto(rank = 3, percentage = 20.0)
    ],
    
    // Step 4: Selection Method
    judgingCriteria = "CREATOR_PICKS" | "RANDOM" | "PAID_VOTING" | "COMMUNITY_VOTING" | "COMBINATION",
    
    // Other fields
    mediaType = "PHOTO_AND_VIDEO",
    category = "CHALLENGE",
    coverMediaUrl = null,
    sponsorName = null,
    sponsorUrl = null
)
```

## Testing

### Manual Testing

#### Test Success Flow
1. Open Contest Creation Wizard
2. Complete all 5 steps with valid data
3. Click "Publish Contest" on step 5
4. Verify button shows "Publishing..." with spinner
5. Verify button is disabled during submission
6. Verify wizard closes automatically on success

#### Test Error Flow
1. Open Contest Creation Wizard
2. Complete all 5 steps with valid data
3. Disconnect network or use invalid data
4. Click "Publish Contest" on step 5
5. Verify button shows "Publishing..." with spinner
6. Verify error message appears below content
7. Verify error message is dismissible
8. Verify wizard stays on step 5
9. Fix issues and retry

#### Test Validation
1. Open Contest Creation Wizard
2. Leave some fields empty
3. Try to proceed to next step
4. Verify "Continue" button is disabled
5. Fill in required fields
6. Verify "Continue" button is enabled

### Backend Testing

#### Test Participation Types
```kotlin
// Test INDIVIDUAL_ONLY
participationType = "INDIVIDUAL_ONLY"
teamSize = null
maxTeams = null

// Test TEAM_ONLY
participationType = "TEAM_ONLY"
teamSize = 5
maxTeams = 10

// Test BOTH
participationType = "BOTH"
teamSize = 3
maxTeams = 20
```

#### Test Error Responses
- 400 Bad Request: Invalid data
- 401 Unauthorized: Not logged in
- 403 Forbidden: Insufficient permissions
- 500 Internal Server Error: Backend error

## Troubleshooting

### Issue: Button stays disabled
**Cause**: Step validation is failing
**Solution**: Check validation errors in each step

### Issue: Error message doesn't appear
**Cause**: Error state is not being set
**Solution**: Check backend response and error handling in publishContest()

### Issue: Wizard doesn't close on success
**Cause**: Success state is not being observed
**Solution**: Check LaunchedEffect in CreateContestScreen

### Issue: Loading indicator doesn't show
**Cause**: isPublishing state is not being set
**Solution**: Check state updates in publishContest()

### Issue: Payload is missing fields
**Cause**: State fields are not populated
**Solution**: Check wizard step completion and state updates

## API Endpoint

**Endpoint**: `POST /api/v1/contests`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**: See "Payload Structure" above

**Success Response** (HTTP 201):
```json
{
  "id": "contest-id",
  "title": "My Contest",
  "status": "ACTIVE",
  ...
}
```

**Error Response** (HTTP 4xx/5xx):
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## State Management

### State Fields
```kotlin
data class CreateContestState(
    // Wizard navigation
    val currentStep: Int = 1,
    
    // Step 1: Details
    val title: String = "",
    val description: String = "",
    val startDate: Instant? = null,
    val endDate: Instant? = null,
    
    // Step 2: Participation
    val participationType: ParticipationType = ParticipationType.INDIVIDUAL_ONLY,
    val teamSize: Int? = null,
    val maxTeams: Int? = null,
    val entryFee: Double = 0.0,
    
    // Step 3: Tasks
    val addedTasks: List<TaskConfiguration> = emptyList(),
    
    // Step 4: Prizes
    val winnerSlots: Int = 1,
    val prizeAmounts: List<Double> = listOf(0.0),
    val selectionMethod: SelectionMethod = SelectionMethod.MANUAL,
    
    // Step 5: Judges
    val judges: List<Judge> = emptyList(),
    
    // UI state
    val isPublishing: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)
```

### State Updates
```kotlin
// Start publishing
_state.value = currentState.copy(isPublishing = true, error = null)

// Success
_state.value = _state.value.copy(isPublishing = false, success = true, error = null)

// Error
_state.value = _state.value.copy(isPublishing = false, success = false, error = "Error message")

// Clear error
_state.value = _state.value.copy(error = null)
```

## Design System

### Colors
- **Yellow Accent**: `#F5A623` - Active states, primary buttons
- **Dark Background**: `#0A0A0F` - Main container
- **Dark Surface**: `#1A1A1F` - Cards, surfaces
- **Gray**: `#3A3A3F` - Inactive states, borders
- **Error Red**: `#FF3B30` - Error messages, borders
- **White**: `#FFFFFF` - Text
- **Light Gray**: `#A0A0A0` - Secondary text

### Typography
- **Headers**: 18-24sp, Bold
- **Body**: 14-16sp, Normal
- **Small**: 12sp, Normal
- **Button**: 16sp, Bold

### Spacing
- **Horizontal Padding**: 20dp
- **Vertical Spacing**: 8-24dp
- **Card Padding**: 16dp
- **Button Height**: 48dp

### Shapes
- **Rounded Corners**: 12dp
- **Circle**: CircleShape
- **Border Width**: 1-2dp

## Requirements Checklist

- ✅ 13.1: Comprehensive payload construction
- ✅ 13.2: participationType field included
- ✅ 13.3: teamSize field included when specified
- ✅ 13.4: maxTeams field included when specified
- ✅ 13.5: POST request to /api/v1/contests
- ✅ 13.6: Success response handling with wizard closure
- ✅ 13.7: Error response handling with error display
- ✅ 13.8: Loading indicator on button
- ✅ 13.9: Button disabled during submission

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the complete implementation in:
   - `.kiro/specs/contest-creation-wizard/task-12-complete-summary.md`
   - `.kiro/specs/contest-creation-wizard/ui-integration-summary.md`
3. Check the requirements document:
   - `.kiro/specs/contest-creation-wizard/requirements.md`
4. Check the design document:
   - `.kiro/specs/contest-creation-wizard/design.md`
