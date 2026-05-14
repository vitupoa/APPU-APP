# Contest Judging API - Quick Reference

## Base URL
```
/api/v1/contests
```

---

## Contest Lifecycle

### Create Contest
```http
POST /api/v1/contests
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Best Dance Video",
  "description": "Show us your best moves",
  "media_type": "VIDEO",
  "category": "DANCE",
  "prizeTotalKr": 1000,
  "maxWinners": 3,
  "prizeDistribution": [
    { "rank": 1, "percentage": 50 },
    { "rank": 2, "percentage": 30 },
    { "rank": 3, "percentage": 20 }
  ],
  "judgingCriteria": "COMBINATION",
  "publicVoteWeight": 40,
  "deadline": "2026-12-31T23:59:59Z",
  "participationType": "INDIVIDUAL_ONLY",
  "airdropKr": 10,
  "airdropLimit": 100
}
```

**Response:**
```json
{
  "contest_id": "uuid",
  "message": "Contest created successfully"
}
```

**Fee Calculation:**
- Prize: Kr 1,000 + 15% = Kr 1,150
- Airdrops: Kr 1,000 + 15% = Kr 1,150
- **Total Charged: Kr 2,300**

---

### Transition to Judging
```http
POST /api/v1/contests/:contestId/transition-to-judging
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Contest transitioned to JUDGING status"
}
```

---

## Judge Management

### Invite Judges
```http
POST /api/v1/contests/:contestId/judges/invite
Authorization: Bearer {token}
Content-Type: application/json

{
  "judgeIds": ["user-id-1", "user-id-2", "user-id-3"]
}
```

**Response:**
```json
{
  "accepted": [
    {
      "id": "invite-id",
      "contest_id": "contest-id",
      "judgeId": "user-id-1",
      "status": "PENDING",
      "contest": { ... }
    }
  ],
  "failed": []
}
```

---

### Get Judge Invitations
```http
GET /api/v1/contests/judge/invitations
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "invite-id",
    "contest_id": "contest-id",
    "status": "PENDING",
    "invitedAt": "2026-05-14T10:00:00Z",
    "contest": {
      "id": "contest-id",
      "title": "Best Dance Video",
      "deadline": "2026-12-31T23:59:59Z"
    }
  }
]
```

---

### Accept Judge Invitation
```http
POST /api/v1/contests/judge/invitations/:inviteId/accept
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true
}
```

---

### Decline Judge Invitation
```http
POST /api/v1/contests/judge/invitations/:inviteId/decline
Authorization: Bearer {token}
```

---

### Get Assigned Contests
```http
GET /api/v1/contests/judge/assigned
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "contest-id",
    "title": "Best Dance Video",
    "status": "JUDGING",
    "prizeTotalKr": 1000,
    "judgingCriteria": "COMBINATION",
    "publicVoteWeight": 40,
    "deadline": "2026-12-31T23:59:59Z"
  }
]
```

---

## Scoring

### Score Submission
```http
POST /api/v1/contests/submissions/:submissionId/score
Authorization: Bearer {token}
Content-Type: application/json

{
  "score": 85.5,
  "feedback": "Excellent choreography and execution!"
}
```

**Validation:**
- Score: 0-100
- Contest must be in JUDGING status
- User must be assigned judge

**Response:**
```json
{
  "id": "score-id",
  "judge_id": "judge-id",
  "submission_id": "submission-id",
  "score": 85.5,
  "feedback": "Excellent choreography and execution!",
  "created_at": "2026-05-14T10:00:00Z"
}
```

---

## Winner Calculation

### Calculate Winners
```http
GET /api/v1/contests/:contestId/calculate-winners
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "userId": "user-id-1",
    "rank": 1,
    "username": "dancer123",
    "displayName": "John Doe",
    "finalScore": 82.5,
    "judgeScore": 85,
    "votesCount": 150
  },
  {
    "userId": "user-id-2",
    "rank": 2,
    "username": "mover456",
    "displayName": "Jane Smith",
    "finalScore": 75.3,
    "judgeScore": 78,
    "votesCount": 120
  }
]
```

---

## Prize Information

### Get Prize Breakdown
```http
GET /api/v1/contests/:contestId/prize-breakdown?currency=kes
```

**Response:**
```json
{
  "totalPrizeKr": 1000,
  "totalPrizeFiat": 14000000,
  "currency": "KES",
  "breakdown": [
    {
      "rank": 1,
      "percentage": 50,
      "amountKr": 500,
      "amountFiat": 7000000,
      "currency": "KES"
    },
    {
      "rank": 2,
      "percentage": 30,
      "amountKr": 300,
      "amountFiat": 4200000,
      "currency": "KES"
    },
    {
      "rank": 3,
      "percentage": 20,
      "amountKr": 200,
      "amountFiat": 2800000,
      "currency": "KES"
    }
  ]
}
```

**Supported Currencies:**
- `usd`, `kes`, `eur`, `gbp`, `ngn`, `zar`, etc.

---

## Prize Distribution

### Automatic Distribution
```http
POST /api/v1/contests/:contestId/distribute-auto
Authorization: Bearer {admin-token}
```

**Process:**
1. Calculates winners automatically
2. Distributes prizes by percentage
3. Credits winner wallets
4. Releases escrow
5. Marks contest COMPLETED

**Response:**
```json
{
  "success": true,
  "message": "Prizes distributed automatically based on scores"
}
```

---

### Manual Distribution
```http
POST /api/v1/contests/:contestId/distribute
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "winnerIds": ["user-id-1", "user-id-2", "user-id-3"]
}
```

**Note:** Still uses percentage distribution, but with manually selected winners.

**Response:**
```json
{
  "success": true,
  "message": "Prizes distributed successfully"
}
```

---

## Contest Queries

### List Contests with Currency
```http
GET /api/v1/contests?currency=kes&status=ACTIVE&limit=20
```

**Response:**
```json
{
  "items": [
    {
      "id": "contest-id",
      "title": "Best Dance Video",
      "prizeTotalKr": 1000,
      "prizeTotalFiat": 14000000,
      "currency": "KES",
      "status": "ACTIVE",
      "judgingCriteria": "COMBINATION",
      "publicVoteWeight": 40,
      "deadline": "2026-12-31T23:59:59Z",
      "totalParticipants": 45,
      "submissionsCount": 38
    }
  ],
  "nextCursor": "cursor-string"
}
```

---

### Get Contest Detail with Currency
```http
GET /api/v1/contests/:contestId?currency=kes
```

**Response:**
```json
{
  "id": "contest-id",
  "title": "Best Dance Video",
  "description": "Show us your best moves",
  "prizeTotalKr": 1000,
  "platformFeeKr": 150,
  "prizeBreakdown": {
    "totalPrizeKr": 1000,
    "totalPrizeFiat": 14000000,
    "currency": "KES",
    "breakdown": [ ... ]
  },
  "prizeDistributions": [
    { "rank": 1, "percentage": 50 },
    { "rank": 2, "percentage": 30 },
    { "rank": 3, "percentage": 20 }
  ],
  "judgingCriteria": "COMBINATION",
  "publicVoteWeight": 40,
  "status": "JUDGING",
  "deadline": "2026-12-31T23:59:59Z",
  "totalParticipants": 45,
  "submissionsCount": 38,
  "isJoined": true
}
```

---

## Judging Criteria Formulas

### CREATOR_PICKS
```
finalScore = avgJudgeScore
```
- Manual winner selection
- Judge scores for guidance

### COMMUNITY_VOTE
```
finalScore = votesCount
```
- Most voted wins

### MOST_ENGAGEMENT
```
finalScore = votesCount
```
- Highest engagement wins
- Extensible to comments, shares

### COMBINATION
```
judgeWeight = 100 - publicVoteWeight
normalizedVotes = min(votesCount / 10, 100)

finalScore = (avgJudgeScore × judgeWeight / 100) + 
             (normalizedVotes × publicVoteWeight / 100)
```

**Example:** `publicVoteWeight = 40`
- Judge scores: 60% weight
- Public votes: 40% weight

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [ ... ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "You are not authorized to judge this contest"
}
```

### 404 Not Found
```json
{
  "error": "Contest not found"
}
```

---

## Status Flow

```
ACTIVE → JUDGING → COMPLETED
```

**ACTIVE:**
- Participants can submit
- Public can vote
- Judges cannot score yet

**JUDGING:**
- No new submissions
- Judges can score
- Public voting closed
- Winners can be calculated

**COMPLETED:**
- Prizes distributed
- Escrow released
- Contest archived

---

## Quick Tips

### Display Prizes
```javascript
// Frontend display priority:
// 1. Fiat amount (large, prominent)
// 2. Kr amount (small, below)

<div>
  <h2>KES 14,000,000</h2>
  <p>Kr 1,000</p>
</div>
```

### Check Contest Status
```javascript
if (contest.status === 'JUDGING') {
  // Show judge scoring UI
} else if (contest.status === 'ACTIVE') {
  // Show submission/voting UI
}
```

### Calculate Expected Prize
```javascript
const rank = 1; // User's rank
const distribution = contest.prizeDistributions.find(d => d.rank === rank);
const prizeKr = (contest.prizeTotalKr * distribution.percentage) / 100;
```

---

## Rate Limits

- **Scoring**: 100 requests per minute per judge
- **Voting**: 10 requests per minute per user
- **Queries**: 1000 requests per minute per user

---

## Webhooks (Future)

Coming soon:
- `contest.transitioned_to_judging`
- `contest.winner_calculated`
- `contest.prize_distributed`

---

## Support

- **Documentation**: `backend/docs/CONTEST_JUDGING.md`
- **Testing Guide**: `backend/tests/contest-judging.test.md`
- **Change Log**: `backend/docs/CONTEST_CHANGES_SUMMARY.md`
