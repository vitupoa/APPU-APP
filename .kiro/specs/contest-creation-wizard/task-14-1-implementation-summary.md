# Task 14.1 Implementation Summary: Update Teams Module to Handle Contest Participation Types

## Overview
This task implements validation logic for team participation in contests based on the contest's `participationType`, `teamSize`, and `maxTeams` configuration. The implementation ensures that the Teams Module enforces all participation constraints defined in Requirements 16.1-16.6.

## Requirements Implemented

### Requirement 16.1: Team Registration for TEAM_ONLY Contests
- ✅ Teams can register for contests with `participationType = TEAM_ONLY`
- ✅ Validation allows team registration when participation type is TEAM_ONLY

### Requirement 16.2: Prevent Individual Registration for TEAM_ONLY Contests
- ✅ Individual registration is blocked for contests with `participationType = TEAM_ONLY`
- ✅ Validation returns error message: "This contest is for teams only. Individual registration is not allowed."

### Requirement 16.3: Allow Both Team and Individual Registration for BOTH Contests
- ✅ Both teams and individuals can register for contests with `participationType = BOTH`
- ✅ Validation allows both registration types

### Requirement 16.4: Prevent Team Registration for INDIVIDUAL_ONLY Contests
- ✅ Team registration is blocked for contests with `participationType = INDIVIDUAL_ONLY`
- ✅ Validation returns error message: "This contest is for individual participants only. Team registration is not allowed."

### Requirement 16.5: Validate Team Size Requirements
- ✅ When contest has `teamSize` requirement, validates that registering teams have exactly that many members
- ✅ Validation returns error message: "This contest requires teams of exactly X members. Your team has Y members."

### Requirement 16.6: Enforce Max Teams Limit
- ✅ When contest has `maxTeams` limit, prevents team registration when limit is reached
- ✅ Validation returns error message: "This contest has reached its maximum team limit of X teams."

## Files Created

### 1. TeamParticipationValidator.kt
**Path:** `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/domain/validation/TeamParticipationValidator.kt`

**Purpose:** Core validation logic for team participation constraints

**Key Functions:**
- `validateTeamRegistration(contest: Contest, team: TeamDto): ValidationResult`
  - Validates all team registration constraints (participation type, team size, max teams)
  - Returns Success or Error with descriptive message

- `validateIndividualRegistration(contest: Contest): ValidationResult`
  - Validates individual registration is allowed based on participation type
  - Returns Success or Error with descriptive message

- `validateTeamSubmission(contest: Contest): ValidationResult`
  - Validates team submission is allowed based on participation type
  - Returns Success or Error with descriptive message

- `isTeamRegistrationAllowed(contest: Contest): Boolean`
  - Quick boolean check for team registration eligibility

- `isIndividualRegistrationAllowed(contest: Contest): Boolean`
  - Quick boolean check for individual registration eligibility

**ValidationResult Sealed Class:**
```kotlin
sealed class ValidationResult {
    object Success : ValidationResult()
    data class Error(val message: String) : ValidationResult()
}
```

### 2. TeamsRepository.kt
**Path:** `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/domain/repository/TeamsRepository.kt`

**Purpose:** Repository interface for team operations with validation

**Key Methods:**
- `registerTeamForContest(contestId, teamId, contest, team): NetworkResult<Unit>`
- `submitTeamEntry(contestId, teamId, request, contest): NetworkResult<Unit>`
- `getTeam(teamId): NetworkResult<TeamDto>`
- `getMyTeams(): NetworkResult<List<TeamDto>>`
- `createTeam(request): NetworkResult<TeamDto>`
- `listTeamContests(cursor, limit): NetworkResult<TeamContestListResponse>`
- `getTeamSubmissions(contestId, cursor, limit): NetworkResult<List<TeamSubmissionDto>>`

### 3. TeamsRepositoryImpl.kt
**Path:** `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/data/repository/TeamsRepositoryImpl.kt`

**Purpose:** Implementation of TeamsRepository with validation integration

**Key Features:**
- Validates team registration before calling API
- Validates team submission before calling API
- Returns appropriate error messages when validation fails
- Delegates to TeamsApi for actual network calls

### 4. TeamParticipationValidatorTest.kt
**Path:** `composeApp/src/commonTest/kotlin/com/krieta/feature/contests/domain/validation/TeamParticipationValidatorTest.kt`

**Purpose:** Comprehensive unit tests for validation logic

**Test Coverage:**
- ✅ Team registration for INDIVIDUAL_ONLY (should fail)
- ✅ Team registration for TEAM_ONLY (should succeed)
- ✅ Team registration for BOTH (should succeed)
- ✅ Team size matches requirement (should succeed)
- ✅ Team size mismatch (should fail)
- ✅ Max teams limit reached (should fail)
- ✅ Below max teams limit (should succeed)
- ✅ Individual registration for TEAM_ONLY (should fail)
- ✅ Individual registration for INDIVIDUAL_ONLY (should succeed)
- ✅ Individual registration for BOTH (should succeed)
- ✅ Team submission for INDIVIDUAL_ONLY (should fail)
- ✅ Team submission for TEAM_ONLY (should succeed)
- ✅ Team submission for BOTH (should succeed)
- ✅ Helper method tests

## Files Modified

### 1. ContestsDtos.kt
**Path:** `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/data/remote/dto/ContestsDtos.kt`

**Changes:**
- Added `participationType: String` field to `ContestDto` (default: "INDIVIDUAL_ONLY")
- Added `teamSize: Int?` field to `ContestDto` (optional)
- Added `maxTeams: Int?` field to `ContestDto` (optional)
- Added `registeredTeamsCount: Int` field to `ContestDto` (default: 0)

### 2. ContestsModels.kt
**Path:** `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/domain/model/ContestsModels.kt`

**Changes:**
- Added `ParticipationType` enum with values: INDIVIDUAL_ONLY, TEAM_ONLY, BOTH
- Added `fromString(value: String)` companion function to ParticipationType
- Added `participationType: ParticipationType` field to `Contest` domain model
- Added `teamSize: Int?` field to `Contest` domain model
- Added `maxTeams: Int?` field to `Contest` domain model
- Added `registeredTeamsCount: Int` field to `Contest` domain model

### 3. ContestsRepositoryImpl.kt
**Path:** `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/data/repository/ContestsRepositoryImpl.kt`

**Changes:**
- Updated `ContestDto.toDomain()` mapper to include participation fields
- Modified `joinContest()` to validate individual registration before API call
- Modified `submitEntry()` to validate individual submission before API call
- Added validation using `TeamParticipationValidator.validateIndividualRegistration()`

## Architecture

### Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer                                 │
│  (Team Registration Screen / Individual Registration)       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
│  TeamsRepositoryImpl / ContestsRepositoryImpl               │
│  - Fetches contest details                                   │
│  - Calls validator                                           │
│  - Returns error or proceeds with API call                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Validation Layer                                │
│  TeamParticipationValidator                                  │
│  - Checks participationType                                  │
│  - Validates team size                                       │
│  - Validates max teams limit                                 │
│  - Returns ValidationResult                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer                                  │
│  TeamsApi / ContestsApi                                      │
│  - Makes network requests                                    │
│  - Returns response                                          │
└─────────────────────────────────────────────────────────────┘
```

### Team Registration Flow

```
User attempts team registration
         │
         ▼
TeamsRepository.registerTeamForContest(contestId, teamId, contest, team)
         │
         ▼
TeamParticipationValidator.validateTeamRegistration(contest, team)
         │
         ├─── participationType == INDIVIDUAL_ONLY? ──> Error
         │
         ├─── teamSize mismatch? ──> Error
         │
         ├─── maxTeams limit reached? ──> Error
         │
         └─── All checks pass ──> Success
                  │
                  ▼
         TeamsApi.registerTeamForContest(contestId, teamId)
                  │
                  ▼
         Backend processes registration
```

### Individual Registration Flow

```
User attempts individual registration
         │
         ▼
ContestsRepository.joinContest(contestId)
         │
         ▼
Fetch contest details
         │
         ▼
TeamParticipationValidator.validateIndividualRegistration(contest)
         │
         ├─── participationType == TEAM_ONLY? ──> Error
         │
         └─── participationType allows individual? ──> Success
                  │
                  ▼
         ContestsApi.joinContest(contestId)
                  │
                  ▼
         Backend processes registration
```

## Error Messages

### Team Registration Errors
1. **INDIVIDUAL_ONLY Contest:**
   - "This contest is for individual participants only. Team registration is not allowed."

2. **Team Size Mismatch:**
   - "This contest requires teams of exactly X members. Your team has Y members."

3. **Max Teams Limit Reached:**
   - "This contest has reached its maximum team limit of X teams."

### Individual Registration Errors
1. **TEAM_ONLY Contest:**
   - "This contest is for teams only. Individual registration is not allowed."

### Team Submission Errors
1. **INDIVIDUAL_ONLY Contest:**
   - "This contest is for individual participants only. Team submissions are not allowed."

## Integration Points

### Backend API Expectations
The implementation expects the backend to:
1. Return `participationType`, `teamSize`, `maxTeams`, and `registeredTeamsCount` fields in `ContestDto`
2. Accept these fields in `CreateContestRequestDto` (already implemented in Task 12.1)
3. Maintain accurate `registeredTeamsCount` for max teams validation

### UI Integration
UI components should:
1. Use `TeamsRepository.registerTeamForContest()` instead of calling `TeamsApi` directly
2. Use `ContestsRepository.joinContest()` for individual registration (already does this)
3. Display validation error messages to users
4. Disable registration buttons when validation fails
5. Show team size requirements and max teams limits in contest details

### Example Usage

```kotlin
// Team Registration
val teamsRepository: TeamsRepository = // inject
val contest: Contest = // fetch from ContestsRepository
val team: TeamDto = // fetch from TeamsRepository

val result = teamsRepository.registerTeamForContest(
    contestId = contest.id,
    teamId = team.id,
    contest = contest,
    team = team
)

when (result) {
    is NetworkResult.Success -> {
        // Show success message
    }
    is NetworkResult.Error -> {
        // Show error message: result.message
    }
}

// Individual Registration
val contestsRepository: ContestsRepository = // inject
val contestId = "contest-123"

val result = contestsRepository.joinContest(contestId)

when (result) {
    is NetworkResult.Success -> {
        // Show success message
    }
    is NetworkResult.Error -> {
        // Show error message: result.message
    }
}
```

## Testing

### Unit Tests
- **File:** `TeamParticipationValidatorTest.kt`
- **Coverage:** 15 test cases covering all validation scenarios
- **Status:** Tests created and ready to run (blocked by pre-existing compilation errors in unrelated files)

### Test Scenarios Covered
1. ✅ Team registration validation for all participation types
2. ✅ Individual registration validation for all participation types
3. ✅ Team size validation (exact match, mismatch)
4. ✅ Max teams limit validation (below limit, at limit)
5. ✅ Team submission validation for all participation types
6. ✅ Helper method validation

## Compilation Status

### My Changes
- ✅ All new files compile successfully
- ✅ All modified files compile successfully
- ✅ No compilation errors introduced by Task 14.1

### Pre-existing Issues
The following pre-existing compilation errors exist in unrelated files:
- `OptimizedPagerState.kt`: Abstract class instantiation error
- `CommentsScreen.kt`: Unresolved reference errors

These errors are NOT related to Task 14.1 and were present before this implementation.

## Next Steps

### For Complete Integration
1. **Backend Coordination:**
   - Ensure backend returns `participationType`, `teamSize`, `maxTeams`, `registeredTeamsCount` in contest responses
   - Verify backend maintains accurate `registeredTeamsCount`

2. **UI Updates:**
   - Update team registration screens to use `TeamsRepository`
   - Display validation errors to users
   - Show team requirements in contest details
   - Add visual indicators for team size and max teams constraints

3. **Dependency Injection:**
   - Register `TeamsRepository` and `TeamsRepositoryImpl` in DI container
   - Inject into ViewModels that handle team operations

4. **Testing:**
   - Fix pre-existing compilation errors to enable test execution
   - Run unit tests to verify validation logic
   - Add integration tests for repository layer
   - Add UI tests for registration flows

## Summary

Task 14.1 has been successfully implemented with:
- ✅ Complete validation logic for all 6 requirements (16.1-16.6)
- ✅ Clean architecture with separation of concerns
- ✅ Comprehensive error messages for user feedback
- ✅ Repository pattern for testability
- ✅ Unit tests covering all scenarios
- ✅ No compilation errors introduced
- ✅ Backward compatible with existing code

The Teams Module now properly validates contest participation types, team size requirements, and max teams limits before allowing registration or submission.
