# Backend API Requirements

## New Endpoints Needed

### 1. Contest Submissions Feed
**Endpoint:** `GET /api/v1/contests/submissions/feed`

**Purpose:** Fetch contest submissions from all active contests for the main feed

**Query Parameters:**
- `cursor` (optional): Pagination cursor
- `limit` (optional): Number of items per page (default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": "submission_123",
      "user": {
        "id": "user_456",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://...",
        "isVerified": true
      },
      "contestId": "contest_789",
      "contest": {
        "id": "contest_789",
        "title": "Dance Challenge",
        "prizeKr": 5000,
        "status": "ACTIVE"
      },
      "mediaUrl": "https://...",
      "mediaType": "VIDEO",
      "caption": "My submission!",
      "proofScreenshots": ["https://..."],
      "votes": 150,
      "rank": 3,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "nextCursor": "cursor_abc123"
}
```

### 2. Vote on Contest Submission
**Endpoint:** `POST /api/v1/contests/submissions/:submissionId/vote`

**Purpose:** Upvote or downvote a contest submission

**Request Body:**
```json
{
  "voteType": "UPVOTE" // or "DOWNVOTE"
}
```

**Response:**
```json
{
  "success": true,
  "newVoteCount": 151
}
```

**Notes:**
- Users can only vote once per submission
- Downvotes are tracked but not displayed publicly
- Voting affects submission ranking

### 3. Tip Contest Participant
**Endpoint:** `POST /api/v1/contests/submissions/:submissionId/tip`

**Purpose:** Send a tip to a contest submission creator

**Request Body:**
```json
{
  "krAmount": 100
}
```

**Response:**
```json
{
  "success": true,
  "newBalance": 900,
  "transaction": {
    "id": "tx_123",
    "amount": 100,
    "recipientId": "user_456",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

**Validation:**
- Minimum tip: 50 Kr
- User must have sufficient balance
- Cannot tip own submissions
- Cannot tip contest submissions (only non-contest content)

### 4. Get Contest Submissions by Contest
**Endpoint:** `GET /api/v1/contests/:contestId/submissions`

**Purpose:** Fetch all submissions for a specific contest

**Query Parameters:**
- `cursor` (optional): Pagination cursor
- `limit` (optional): Number of items per page
- `sortBy` (optional): `votes`, `recent`, `rank`

**Response:** Same format as submissions feed

## Existing Endpoints to Verify

### Profile Image Upload
**Endpoint:** `POST /api/v1/media/upload-signature`

**Verify:**
- Supports `folder` parameter for organizing uploads
- Returns proper Cloudinary signature
- Works with `avatars` and `banners` folders

### Exchange Rate
**Endpoint:** `GET /api/v1/wallet/exchange-rate`

**Verify:**
- Returns current exchange rate for user's currency
- Cached appropriately (5-minute refresh)

## Database Schema Updates

### Contest Submissions Table
Add fields if not present:
- `votes` (integer, default: 0)
- `downvotes` (integer, default: 0, not displayed)
- `rank` (integer, nullable)

### Contest Votes Table (New)
```sql
CREATE TABLE contest_votes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID NOT NULL REFERENCES contest_submissions(id),
  vote_type VARCHAR(10) NOT NULL, -- 'UPVOTE' or 'DOWNVOTE'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, submission_id)
);

CREATE INDEX idx_contest_votes_submission ON contest_votes(submission_id);
CREATE INDEX idx_contest_votes_user ON contest_votes(user_id);
```

## Business Logic

### Voting Rules
1. One vote per user per submission
2. Users can change their vote (upvote → downvote or vice versa)
3. Voting on own submissions is not allowed
4. Votes affect submission ranking in real-time
5. Only upvotes are displayed publicly

### Tipping Rules
1. Minimum tip: 50 Kr
2. Tipping only available for non-contest content
3. Cannot tip own content
4. Tips are instant and non-refundable
5. Creator receives 100% of tip (no platform fee)

### Contest Submission Feed Algorithm
1. Show submissions from active contests only
2. Prioritize recent submissions
3. Mix submissions from different contests
4. Consider user's engagement history
5. Filter out submissions user has already voted on (optional)

## Security Considerations

1. **Rate Limiting:**
   - Voting: 100 votes per hour per user
   - Tipping: 50 tips per hour per user
   - Submission feed: 1000 requests per hour per user

2. **Validation:**
   - Verify contest is active before allowing votes
   - Verify user has sufficient balance before tipping
   - Verify submission belongs to contest
   - Prevent vote manipulation

3. **Authorization:**
   - All endpoints require authentication
   - Verify user owns wallet for tipping
   - Verify user hasn't been banned from voting

## Performance Optimization

1. **Caching:**
   - Cache submission feed for 30 seconds
   - Cache vote counts for 10 seconds
   - Cache contest details for 5 minutes

2. **Indexing:**
   - Index on `contest_submissions.votes` for ranking
   - Index on `contest_submissions.created_at` for recent sorting
   - Index on `contest_submissions.contest_id` for filtering

3. **Pagination:**
   - Use cursor-based pagination
   - Limit to 20 items per page
   - Pre-fetch next page in background

## Testing Checklist

- [ ] Submission feed returns correct data
- [ ] Voting updates counts correctly
- [ ] Tipping deducts balance and credits recipient
- [ ] Cannot vote twice on same submission
- [ ] Cannot tip with insufficient balance
- [ ] Cannot tip own submissions
- [ ] Downvotes are tracked but not displayed
- [ ] Contest banner shows correct prize amount
- [ ] Currency conversion works correctly
- [ ] Pagination works correctly
- [ ] Rate limiting prevents abuse
