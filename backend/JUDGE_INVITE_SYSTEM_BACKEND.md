# Judge Invite System - Backend Implementation

## Overview
Complete backend implementation of the judge invite system including database schema, API endpoints, service methods, and access control.

## Database Schema

### New Table: judge_invites

```sql
CREATE TABLE "judge_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contest_id" TEXT NOT NULL,
    "judge_id" TEXT NOT NULL,
    "status" "JudgeInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "judge_invites_contest_id_fkey" 
        FOREIGN KEY ("contest_id") REFERENCES "contests"("id") 
        ON DELETE CASCADE,
    CONSTRAINT "judge_invites_judge_id_fkey" 
        FOREIGN KEY ("judge_id") REFERENCES "users"("id") 
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX "judge_invites_contest_id_judge_id_key" 
    ON "judge_invites"("contest_id", "judge_id");
CREATE INDEX "judge_invites_judge_id_idx" ON "judge_invites"("judge_id");
CREATE INDEX "judge_invites_contest_id_idx" ON "judge_invites"("contest_id");
CREATE INDEX "judge_invites_status_idx" ON "judge_invites"("status");
```

### Enum: JudgeInviteStatus
```typescript
enum JudgeInviteStatus {
  PENDING   // Invitation sent, awaiting response
  ACCEPTED  // Judge accepted the invitation
  DECLINED  // Judge declined the invitation
}
```

## API Endpoints

### 1. Create Contest (Updated)
```
POST /api/v1/contests
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "mediaType": "PHOTO" | "VIDEO" | "PHOTO_AND_VIDEO",
  "category": "string",
  "prizeKr": number,
  "requiredActions": [...],
  "maxWinners": number,
  "prizeDistribution": [...],
  "judgingCriteria": "string",
  "deadline": "ISO8601 datetime",
  "participationType": "INDIVIDUAL_ONLY" | "TEAM_ONLY" | "BOTH",
  "teamSize": number (optional),
  "maxTeams": number (optional)
}
```

**Response:**
```json
{
  "contestId": "uuid",
  "id": "uuid",
  "title": "string",
  "description": "string",
  ...
}
```

**Changes:**
- Now returns `contestId` in response for immediate judge invite sending

### 2. Invite Judges
```
POST /api/v1/contests/:contestId/judges/invite
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "judgeIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "accepted": [
    {
      "id": "invite-uuid",
      "contestId": "contest-uuid",
      "judgeId": "user-uuid",
      "status": "PENDING",
      "invitedAt": "ISO8601",
      "respondedAt": null,
      "contest": {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "coverMediaUrl": "string",
        "creatorUsername": "string",
        "creatorDisplayName": "string",
        "deadline": "ISO8601",
        "prizeKr": number
      }
    }
  ],
  "failed": ["uuid4", "uuid5"]
}
```

**Validation:**
- Maximum 15 judges per request
- Checks if judge exists
- Prevents duplicate invitations
- Returns partial success (accepted + failed lists)

### 3. Get Judge Invitations
```
GET /api/v1/contests/judge/invitations
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "invite-uuid",
    "contestId": "contest-uuid",
    "judgeId": "user-uuid",
    "status": "PENDING",
    "invitedAt": "ISO8601",
    "respondedAt": null,
    "contest": {
      "id": "uuid",
      "title": "Contest Title",
      "description": "Contest description",
      "coverMediaUrl": "https://...",
      "creatorUsername": "creator123",
      "creatorDisplayName": "Creator Name",
      "deadline": "ISO8601",
      "prizeKr": 1000
    }
  }
]
```

**Features:**
- Returns only PENDING invitations
- Includes full contest details
- Ordered by invitation date (newest first)

### 4. Accept Judge Invitation
```
POST /api/v1/contests/judge/invitations/:inviteId/accept
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

**Actions:**
- Updates invite status to ACCEPTED
- Sets respondedAt timestamp
- Grants judge access to contest dashboard
- TODO: Sends notification to contest creator

### 5. Decline Judge Invitation
```
POST /api/v1/contests/judge/invitations/:inviteId/decline
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

**Actions:**
- Updates invite status to DECLINED
- Sets respondedAt timestamp
- Removes invitation from pending list
- TODO: Sends notification to contest creator

### 6. Get Assigned Contests (Judge Dashboard)
```
GET /api/v1/contests/judge/assigned
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "contest-uuid",
    "creator": {
      "id": "uuid",
      "username": "string",
      "displayName": "string",
      "avatarUrl": "string"
    },
    "title": "string",
    "description": "string",
    "mediaType": "PHOTO",
    "contestCategory": "CHALLENGE",
    "prizeKr": number,
    "platformFeeKr": number,
    "totalChargedKr": number,
    "maxWinners": number,
    "judgingCriteria": "string",
    "deadline": "ISO8601",
    "coverMediaUrl": "string",
    "status": "ACTIVE",
    "participantsCount": number,
    "submissionsCount": number,
    "createdAt": "ISO8601"
  }
]
```

**Access Control:**
- Only returns contests where judge has ACCEPTED invitation
- Used by Judge Dashboard to show assigned contests

## Service Methods

### ContestService.inviteJudges()
```typescript
static async inviteJudges(contestId: string, judgeIds: string[]): Promise<{
  accepted: JudgeInvite[];
  failed: string[];
}>
```

**Logic:**
1. Validates contest exists
2. For each judgeId:
   - Checks if user exists
   - Checks for duplicate invitation
   - Creates invite with PENDING status
   - Adds to accepted or failed list
3. Returns partial success result

### ContestService.getJudgeInvitations()
```typescript
static async getJudgeInvitations(userId: string): Promise<JudgeInvite[]>
```

**Logic:**
1. Queries judge_invites where judgeId = userId AND status = PENDING
2. Includes full contest details
3. Orders by invitedAt DESC
4. Returns formatted invitations

### ContestService.acceptJudgeInvite()
```typescript
static async acceptJudgeInvite(inviteId: string, userId: string): Promise<{ success: boolean }>
```

**Logic:**
1. Validates invite exists and belongs to user
2. Checks invite is still PENDING
3. Updates status to ACCEPTED
4. Sets respondedAt timestamp
5. TODO: Sends notification

### ContestService.declineJudgeInvite()
```typescript
static async declineJudgeInvite(inviteId: string, userId: string): Promise<{ success: boolean }>
```

**Logic:**
1. Validates invite exists and belongs to user
2. Checks invite is still PENDING
3. Updates status to DECLINED
4. Sets respondedAt timestamp
5. TODO: Sends notification

### ContestService.getAssignedContests()
```typescript
static async getAssignedContests(judgeId: string): Promise<Contest[]>
```

**Logic:**
1. Queries judge_invites where judgeId = userId AND status = ACCEPTED
2. Joins with contests table
3. Returns full contest details
4. Used by Judge Dashboard

## Access Control

### Judge Dashboard Access
- **Endpoint**: `GET /api/v1/contests/judge/assigned`
- **Authorization**: Requires valid JWT token
- **Logic**: Only returns contests where user has ACCEPTED judge invitation
- **Frontend**: JudgeDashboardScreen uses this endpoint

### Invite Authorization
- **Create Invites**: Only contest creator can invite judges
- **Accept/Decline**: Only invited judge can respond
- **View Invitations**: Only shows user's own invitations

## Migration Steps

1. **Run Prisma Migration:**
```bash
cd backend
npx prisma migrate dev --name add_judge_invites
```

2. **Generate Prisma Client:**
```bash
npx prisma generate
```

3. **Restart Backend:**
```bash
npm run dev
```

## Testing Checklist

### Database
- [ ] Migration runs successfully
- [ ] judge_invites table created
- [ ] Indexes created
- [ ] Foreign keys working
- [ ] Unique constraint on (contestId, judgeId)

### API Endpoints
- [ ] POST /contests/:id/judges/invite - creates invites
- [ ] GET /contests/judge/invitations - returns pending invites
- [ ] POST /contests/judge/invitations/:id/accept - accepts invite
- [ ] POST /contests/judge/invitations/:id/decline - declines invite
- [ ] GET /contests/judge/assigned - returns assigned contests

### Service Methods
- [ ] inviteJudges() - handles partial success
- [ ] getJudgeInvitations() - filters by status
- [ ] acceptJudgeInvite() - updates status
- [ ] declineJudgeInvite() - updates status
- [ ] getAssignedContests() - filters by accepted

### Access Control
- [ ] Only contest creator can invite
- [ ] Only invited judge can accept/decline
- [ ] Judge dashboard shows only accepted contests
- [ ] Unauthorized access returns 401/403

### Edge Cases
- [ ] Duplicate invitation attempt
- [ ] Non-existent judge
- [ ] Already responded invitation
- [ ] Unauthorized access
- [ ] Invalid invite ID

## Notification System (TODO)

The following notification hooks should be implemented:

### 1. Judge Invited
```typescript
await NotificationService.sendJudgeInvite(judgeId, contestId);
```
- **Trigger**: When judge is invited
- **Recipient**: Judge
- **Content**: "You've been invited to judge [Contest Title]"
- **Action**: Link to invitations screen

### 2. Judge Accepted
```typescript
await NotificationService.notifyJudgeAccepted(contestId, judgeId);
```
- **Trigger**: When judge accepts invitation
- **Recipient**: Contest creator
- **Content**: "[Judge Name] accepted your judge invitation"

### 3. Judge Declined
```typescript
await NotificationService.notifyJudgeDeclined(contestId, judgeId);
```
- **Trigger**: When judge declines invitation
- **Recipient**: Contest creator
- **Content**: "[Judge Name] declined your judge invitation"

### 4. Contest Deadline Reminder
```typescript
await NotificationService.remindJudgeDeadline(judgeId, contestId);
```
- **Trigger**: 24 hours before contest deadline
- **Recipient**: Accepted judges
- **Content**: "Contest [Title] ends in 24 hours - review submissions"

## Files Modified

1. **backend/prisma/schema.prisma**
   - Added JudgeInviteStatus enum
   - Added JudgeInvite model
   - Updated User model (judgeInvites relation)
   - Updated Contest model (judgeInvites relation)

2. **backend/src/modules/contests/contests.service.ts**
   - Updated createContest() to return contestId
   - Added inviteJudges()
   - Added getJudgeInvitations()
   - Added acceptJudgeInvite()
   - Added declineJudgeInvite()
   - Added getAssignedContests()

3. **backend/src/modules/contests/contests.routes.ts**
   - Added POST /:id/judges/invite
   - Added GET /judge/invitations
   - Added POST /judge/invitations/:id/accept
   - Added POST /judge/invitations/:id/decline
   - Added GET /judge/assigned

## Files Created

1. **backend/prisma/migrations/20240120_add_judge_invites/migration.sql**
   - Database migration for judge_invites table

2. **backend/JUDGE_INVITE_SYSTEM_BACKEND.md**
   - This documentation file

## Summary

✅ **Completed:**
- Database schema with judge_invites table
- All API endpoints for invite system
- Service methods with proper validation
- Access control for judge dashboard
- Partial success handling for bulk invites
- Comprehensive error handling

🔄 **TODO:**
- Notification system integration
- Email notifications for invites
- Push notifications for mobile
- Analytics tracking for invite acceptance rate

The backend is now fully functional and ready to work with the frontend implementation!
