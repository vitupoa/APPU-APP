# Contest Submission Feature

## Overview
Complete contest submission system with requirement validation, media upload, and proof screenshots.

## Features Implemented

### Frontend (Kotlin Multiplatform)

#### 1. Domain Models
- **ContestAction**: Represents a requirement action (follow, subscribe, watch, etc.)
- **ContestRequirements**: Contains actions list, submission status, and eligibility

#### 2. API Layer
- `getContestRequirements(contestId)`: Fetches contest requirements and user eligibility
- `submitEntry(contestId, mediaUrl, mediaType, proofUrls)`: Submits contest entry

#### 3. ViewModel (`SubmitContestViewModel`)
**State Management:**
- Contest details
- Requirements list
- Media selection (photo/video)
- Proof screenshots (multiple)
- Upload progress tracking
- Submission status

**Key Methods:**
- `onMediaSelected(uri)`: Handle media selection
- `onProofAdded(uri)`: Add proof screenshot
- `onProofRemoved(uri)`: Remove proof screenshot
- `submitEntry()`: Validate and submit entry

#### 4. UI Screen (`SubmitContestScreen`)
**Components:**
- Contest info card (title, cover, prize)
- Requirements checklist with icons
- Media upload section (photo/video)
- Proof screenshots grid (for verifiable actions)
- Submit button with validation

**Validation:**
- Must join contest first
- Must complete all requirements
- Must select media
- Must provide proof for verifiable actions
- Cannot submit if already submitted

### Backend (Node.js/Express)

#### 1. New Endpoint: GET /api/v1/contests/:id/requirements
**Purpose:** Get contest requirements and user eligibility

**Response:**
```json
{
  "actions": [
    {
      "id": "uuid",
      "actionType": "FOLLOW_RUNINGA",
      "targetUrl": "https://...",
      "label": "Follow @runinga on Instagram",
      "isVerifiable": true,
      "requiresUpload": true,
      "sortOrder": 0
    }
  ],
  "hasSubmitted": false,
  "canSubmit": true
}
```

**Business Logic:**
- Checks if user has joined contest
- Checks if user has already submitted
- Returns eligibility based on contest status (ACTIVE)

#### 2. Enhanced Endpoint: POST /api/v1/contests/:id/submit
**Validation:**
- User must be a participant (joined contest)
- Contest must be ACTIVE
- One submission per user per contest
- Media URL and type required
- Proof URLs optional (for verifiable actions)

**Process:**
1. Verify contest status
2. Verify user participation
3. Create submission record
4. Increment contest submission count
5. Return submission with user details

## Action Types Supported

| Type | Icon | Description | Requires Proof |
|------|------|-------------|----------------|
| FOLLOW_RUNINGA | Person | Follow Runinga account | Optional |
| YOUTUBE_SUB | PlayArrow | Subscribe on YouTube | Yes |
| SPOTIFY_FOLLOW | MusicNote | Follow on Spotify | Yes |
| INSTAGRAM_FOLLOW | Camera | Follow on Instagram | Yes |
| TIKTOK_FOLLOW | MusicNote | Follow on TikTok | Yes |
| WATCH_VIDEO | PlayCircle | Watch video | No |
| VISIT_SHOP | ShoppingCart | Visit shop | No |
| CUSTOM | CheckCircle | Custom action | Optional |

## User Flow

1. **View Contest** → User sees contest details
2. **Join Contest** → User clicks "Join" button
3. **Navigate to Submit** → User clicks "Submit Entry"
4. **View Requirements** → Screen loads requirements and eligibility
5. **Complete Actions** → User completes external actions (follow, subscribe, etc.)
6. **Select Media** → User picks photo or video
7. **Upload Proof** → User uploads proof screenshots (if required)
8. **Submit** → System validates and creates submission
9. **Success** → User is redirected back to contest

## Validation Rules

### Frontend Validation
- ✅ Media must be selected
- ✅ User must have joined contest
- ✅ Cannot submit if already submitted
- ✅ Submit button disabled during upload/submission

### Backend Validation
- ✅ User must be participant
- ✅ Contest must be ACTIVE
- ✅ One submission per user per contest
- ✅ Media URL must be valid
- ✅ Media type must be "photo" or "video"

## Database Schema

### contest_actions
```sql
- id: UUID
- contest_id: UUID (FK)
- action_type: VARCHAR (enum)
- target_url: VARCHAR (nullable)
- label: VARCHAR
- is_verifiable: BOOLEAN
- requires_upload: BOOLEAN
- sort_order: INT
```

### contest_submissions
```sql
- id: UUID
- contest_id: UUID (FK)
- user_id: UUID (FK)
- media_url: VARCHAR
- media_type: VARCHAR
- proof_urls: VARCHAR[] (array)
- votes_count: INT
- judge_score: DECIMAL
- final_score: DECIMAL
- rank: INT (nullable)
- submitted_at: TIMESTAMP
- UNIQUE(contest_id, user_id)
```

## Integration Points

### Navigation
```kotlin
// From ContestDetailScreen
navigator.push(SubmitContestScreen(contestId))
```

### Dependency Injection
```kotlin
factory { (contestId: String) -> 
    SubmitContestViewModel(contestId, get()) 
}
```

### Media Upload
The screen provides hooks for media upload:
- `onMediaSelected(uri)`: Called when user picks media
- `setUploadingMedia(true)`: Show upload progress
- `onMediaUploaded(url)`: Called with Cloudinary URL
- Same pattern for proof screenshots

## Testing Checklist

### Frontend
- [ ] Requirements load correctly
- [ ] Media picker opens
- [ ] Proof screenshots can be added/removed
- [ ] Submit button enables/disables correctly
- [ ] Error messages display
- [ ] Success navigation works
- [ ] Loading states show during upload/submit

### Backend
- [ ] GET /contests/:id/requirements returns correct data
- [ ] POST /contests/:id/submit creates submission
- [ ] Validation prevents duplicate submissions
- [ ] Validation requires participation
- [ ] Contest submission count increments
- [ ] Proof URLs are stored correctly

## Next Steps

1. **Implement Media Upload**: Integrate Cloudinary upload in mobile app
2. **Add Action Verification**: Backend logic to verify completed actions
3. **Add Submission Feed**: Display all submissions in contest
4. **Add Voting**: Allow users to vote on submissions
5. **Add Judging**: Allow judges to score submissions

## Notes

- Proof screenshots are optional but recommended for verifiable actions
- Users can only submit once per contest
- Contest creator cannot submit to their own contest (enforced in voting, not submission)
- Media type is auto-detected from URL extension
- All uploads should go through Cloudinary with signed preset
