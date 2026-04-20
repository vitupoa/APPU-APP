# Judge Invite System - Complete Implementation

## Overview
Complete implementation of the judge invite system that allows contest creators to invite judges, and judges to accept or decline invitations. Once accepted, judges gain access to the Contest Judge Dashboard.

## Features Implemented

### 1. Debounced Search (500ms delay)
- ✅ Reduces API load by waiting 500ms after user stops typing
- ✅ Cancels previous search requests when user continues typing
- ✅ Minimum 2 characters required to trigger search

### 2. Judge Invite System
- ✅ Send invites when contest is published
- ✅ View pending invitations
- ✅ Accept/Decline invitations
- ✅ Automatic access to Judge Dashboard upon acceptance

## Architecture

### Data Layer

#### DTOs Created:
1. **JudgeInviteRequestDto** - Request to invite judges
2. **JudgeInviteDto** - Judge invitation data
3. **ContestSummaryDto** - Contest summary for invitations
4. **JudgeInviteResponseDto** - Response after sending invites
5. **CreateContestResponseDto** - Returns contest ID after creation

#### Domain Models Created:
1. **JudgeInvite** - Domain model for invitations
2. **JudgeInviteStatus** - Enum (PENDING, ACCEPTED, DECLINED)
3. **ContestSummary** - Contest summary domain model

### API Endpoints

#### ContestsApi New Methods:
```kotlin
// Send judge invites
POST /api/v1/contests/:contestId/judges/invite
Body: { judgeIds: ["userId1", "userId2"] }
Response: { accepted: [...], failed: [...] }

// Get user's judge invitations
GET /api/v1/contests/judge/invitations
Response: [JudgeInviteDto]

// Accept invitation
POST /api/v1/contests/judge/invitations/:inviteId/accept

// Decline invitation
POST /api/v1/contests/judge/invitations/:inviteId/decline
```

### Repository Layer

#### ContestsRepository New Methods:
```kotlin
suspend fun inviteJudges(contestId: String, judgeIds: List<String>): NetworkResult<List<JudgeInvite>>
suspend fun getJudgeInvitations(): NetworkResult<List<JudgeInvite>>
suspend fun acceptJudgeInvite(inviteId: String): NetworkResult<Unit>
suspend fun declineJudgeInvite(inviteId: String): NetworkResult<Unit>
```

### Presentation Layer

#### New Screen: JudgeInvitationsScreen
- Displays pending judge invitations
- Shows contest details (title, creator, prize, cover image)
- Accept/Decline buttons for each invitation
- Loading and error states
- Empty state when no invitations

#### New ViewModel: JudgeInvitationsViewModel
- `loadInvitations()` - Fetches pending invitations
- `acceptInvite(inviteId)` - Accepts an invitation
- `declineInvite(inviteId)` - Declines an invitation
- State management for loading, error, and processing states

#### Updated: CreateContestViewModel
- **Debounced search** with 500ms delay
- **Automatic judge invites** after contest creation
- Handles invite failures gracefully (contest still created)

## User Flow

### Contest Creator Flow:
1. Create contest in wizard
2. Search for users to add as judges (debounced search)
3. Add judges from search results
4. Publish contest
5. **System automatically sends invites to all added judges**

### Judge Flow:
1. Receive notification of judge invitation (backend handles this)
2. Navigate to Judge Invitations screen
3. View contest details and invitation
4. Accept or Decline invitation
5. **If accepted**: Gain access to Contest Judge Dashboard
6. **If declined**: Invitation removed from list

## Access Control

### Judge Dashboard Access:
- Only users who have **accepted** judge invitations can access the dashboard
- Backend validates judge status before showing contest data
- Judges can only see contests they've been invited to and accepted

### Existing Judge Dashboard Features:
- View assigned contests
- See contest analytics
- Review submissions
- Approve winners
- 72-hour deadline warnings

## Implementation Details

### Debouncing Implementation:
```kotlin
private var searchJob: kotlinx.coroutines.Job? = null

fun updateJudgeSearchQuery(v: String) { 
    _state.value = _state.value.copy(judgeSearchQuery = v)
    
    // Cancel previous search job
    searchJob?.cancel()
    
    if (v.length >= 2) {
        searchJob = screenModelScope.launch {
            // Debounce: wait 500ms before searching
            kotlinx.coroutines.delay(500)
            searchJudges(v)
        }
    } else {
        _state.value = _state.value.copy(
            judgeSearchResults = emptyList(), 
            isSearchingJudges = false
        )
    }
}
```

### Judge Invite on Contest Creation:
```kotlin
when (val result = repository.createContest(request)) {
    is NetworkResult.Success -> {
        val contestId = result.data
        
        // Send judge invites if judges were assigned
        if (currentState.judges.isNotEmpty()) {
            val judgeIds = currentState.judges.map { it.userId }
            repository.inviteJudges(contestId, judgeIds)
        }
        
        _state.value = _state.value.copy(
            isPublishing = false,
            success = true
        )
    }
}
```

## Backend Requirements

The backend needs to implement these endpoints:

### 1. Create Contest Response
```typescript
POST /api/v1/contests
Response: {
  contestId: string,
  message: string
}
```

### 2. Invite Judges
```typescript
POST /api/v1/contests/:contestId/judges/invite
Body: {
  judgeIds: string[]
}
Response: {
  accepted: JudgeInvite[],
  failed: string[]
}
```

### 3. Get Judge Invitations
```typescript
GET /api/v1/contests/judge/invitations
Response: JudgeInvite[]
```

### 4. Accept/Decline Invitation
```typescript
POST /api/v1/contests/judge/invitations/:inviteId/accept
POST /api/v1/contests/judge/invitations/:inviteId/decline
```

### 5. Judge Dashboard Access Control
```typescript
// Backend should check if user has accepted judge invite
GET /api/v1/contests/judge/assigned
// Only returns contests where user is an accepted judge
```

## Notification System (Backend)

The backend should send notifications when:
1. **Judge invited**: Notify user they've been invited to judge a contest
2. **Invite accepted**: Notify contest creator that judge accepted
3. **Invite declined**: Notify contest creator that judge declined
4. **Contest deadline approaching**: Remind judges to review submissions

## Database Schema (Backend)

### judge_invites table:
```sql
CREATE TABLE judge_invites (
  id UUID PRIMARY KEY,
  contest_id UUID REFERENCES contests(id),
  judge_id UUID REFERENCES users(id),
  status VARCHAR(20) CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  invited_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_judge_invites_judge_id ON judge_invites(judge_id);
CREATE INDEX idx_judge_invites_contest_id ON judge_invites(contest_id);
CREATE INDEX idx_judge_invites_status ON judge_invites(status);
```

## Testing Checklist

### Search Debouncing:
- [ ] Type quickly - only one API call after 500ms
- [ ] Type, wait 500ms, type again - two API calls
- [ ] Type less than 2 characters - no API call
- [ ] Clear search - results cleared immediately

### Judge Invites:
- [ ] Create contest with judges - invites sent
- [ ] Create contest without judges - no invites sent
- [ ] Invite fails - contest still created
- [ ] Multiple judges - all receive invites

### Judge Invitations Screen:
- [ ] View pending invitations
- [ ] Accept invitation - removed from list
- [ ] Decline invitation - removed from list
- [ ] No invitations - empty state shown
- [ ] Loading state - spinner shown
- [ ] Error state - retry button shown

### Judge Dashboard Access:
- [ ] Accepted judge - can access dashboard
- [ ] Declined judge - cannot access dashboard
- [ ] Non-judge - cannot access dashboard
- [ ] Judge sees only their assigned contests

## Files Created

1. `JudgeInviteDtos.kt` - DTOs for judge invites
2. `JudgeInvite.kt` - Domain models
3. `JudgeInviteMappers.kt` - DTO to domain mappers
4. `JudgeInvitationsScreen.kt` - UI for viewing invitations
5. `JudgeInvitationsViewModel.kt` - ViewModel for invitations
6. `JUDGE_INVITE_SYSTEM.md` - This documentation

## Files Modified

1. `CreateContestViewModel.kt` - Added debouncing and invite sending
2. `ContestsApi.kt` - Added invite endpoints
3. `ContestsRepository.kt` - Added invite methods
4. `ContestsRepositoryImpl.kt` - Implemented invite methods
5. `ContestsDtos.kt` - Added CreateContestResponseDto
6. `ContestsModule.kt` - Added JudgeInvitationsViewModel to DI

## Design System Compliance

All new UI components follow the Krieta design system:
- **Yellow Accent (#F5A623)**: Accept buttons, prize display, loading indicators
- **Red (#FF3B30)**: Decline buttons, error messages
- **Dark Background (#0A0A0F)**: Screen background
- **Dark Surface (#1A1A1F)**: Card backgrounds
- **Gray (#3A3A3F)**: Borders, dividers, disabled states
- **12dp rounded corners**: Cards and buttons
- **Proper spacing**: 12dp, 16dp as per design system

## Next Steps

### Backend Implementation:
1. Implement all judge invite endpoints
2. Add notification system for invites
3. Implement access control for judge dashboard
4. Add database migrations for judge_invites table

### Frontend Enhancements:
1. Add notification badge for pending invitations
2. Add deep linking to invitations from notifications
3. Add judge management screen for contest creators
4. Add ability to remove judges before contest starts

### Analytics:
1. Track invite acceptance rate
2. Track judge activity on dashboard
3. Track time to accept/decline invitations

## Summary

The judge invite system is now fully implemented on the frontend with:
- ✅ Debounced search (500ms) to reduce API load
- ✅ Automatic invite sending on contest creation
- ✅ Judge invitations screen with accept/decline
- ✅ Integration with existing judge dashboard
- ✅ Complete error handling and loading states
- ✅ Design system compliance

The backend needs to implement the API endpoints and notification system to complete the feature.
