# Contest Judging System Documentation

## Overview

The contest judging system provides comprehensive functionality for managing contest lifecycle, judging submissions, calculating winners, and distributing prizes based on configurable criteria.

## Features Implemented

### 1. Airdrop Fee Calculation (Fixed)
- **Issue**: Airdrops were not charged the 15% platform fee
- **Fix**: Platform now charges 15% fee on airdrops, daily prizes, and main prize pool
- **Formula**: 
  ```
  Total Charged = Prize + (Prize × 0.15) + 
                  Daily Prizes + (Daily Prizes × 0.15) + 
                  Airdrops + (Airdrops × 0.15)
  ```

### 2. Automatic Contest Status Transition
- **Worker**: `contestDeadline.worker.ts`
- **Schedule**: Runs every 5 minutes
- **Function**: Automatically transitions contests from `ACTIVE` to `JUDGING` when deadline passes
- **Manual Override**: Contest creators can manually transition to JUDGING before deadline

### 3. Judge Scoring System

#### Judge Assignment
- Judges are invited via `POST /api/v1/contests/:id/judges/invite`
- Judges accept/decline invitations
- Only accepted judges can score submissions

#### Scoring API
- **Endpoint**: `POST /api/v1/contests/submissions/:submissionId/score`
- **Auth**: Judge must be assigned to the contest
- **Payload**:
  ```json
  {
    "score": 85.5,  // 0-100
    "feedback": "Great creativity and execution"
  }
  ```
- **Validation**: 
  - Contest must be in `JUDGING` status
  - Judge must be authorized
  - Score must be between 0-100

#### Score Calculation
- **Average Judge Score**: Mean of all judge scores for a submission
- **Final Score**: Calculated based on judging criteria (see below)

### 4. Judging Criteria

#### CREATOR_PICKS
- Winner selection is manual by contest creator
- Final score = Average judge score
- Creator reviews scores and selects winners

#### COMMUNITY_VOTE
- Winners determined by public votes
- Final score = Vote count
- Most voted submissions win

#### MOST_ENGAGEMENT
- Winners determined by engagement metrics
- Final score = Vote count (can be extended to include comments, shares)
- Highest engagement wins

#### COMBINATION
- Weighted combination of judge scores and public votes
- **Formula**:
  ```
  judgeWeight = 100 - publicVoteWeight
  normalizedVotes = min(votes / 10, 100)  // Scale votes to 0-100
  
  finalScore = (avgJudgeScore × judgeWeight / 100) + 
               (normalizedVotes × publicVoteWeight / 100)
  ```
- **Example**: If `publicVoteWeight = 30`:
  - Judge scores contribute 70%
  - Public votes contribute 30%

### 5. Winner Calculation

#### Automatic Calculation
- **Endpoint**: `GET /api/v1/contests/:id/calculate-winners`
- **Process**:
  1. Recalculates all submission scores
  2. Sorts by final_score (DESC), then submitted_at (ASC) for tiebreaker
  3. Selects top N submissions (where N = max_winners)
  4. Updates rank field for each submission
- **Returns**: Array of winners with scores and ranks

#### Manual Selection
- Admin can still manually provide winner IDs
- Useful for CREATOR_PICKS criteria

### 6. Prize Distribution

#### Percentage-Based Distribution
- Contest creator sets percentage for each rank
- **Example**:
  ```json
  {
    "prizeDistributions": [
      { "rank": 1, "percentage": 50 },
      { "rank": 2, "percentage": 30 },
      { "rank": 3, "percentage": 20 }
    ]
  }
  ```
- **Validation**: Percentages must sum to 100%

#### Distribution Methods

**Automatic Distribution**:
```
POST /api/v1/contests/:id/distribute-auto
```
- Calculates winners automatically
- Distributes prizes based on percentages
- Requires admin authentication

**Manual Distribution**:
```
POST /api/v1/contests/:id/distribute
Body: { "winnerIds": ["user-id-1", "user-id-2"] }
```
- Admin provides winner IDs
- Still uses percentage distribution
- Useful for CREATOR_PICKS

#### Prize Calculation
```javascript
for each winner:
  distribution = find distribution for winner.rank
  prizeAmount = (totalPrize × distribution.percentage) / 100
  credit winner wallet with prizeAmount
```

### 7. Currency Conversion for Prize Display

#### Prize Breakdown API
- **Endpoint**: `GET /api/v1/contests/:id/prize-breakdown?currency=kes`
- **Returns**:
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
      }
    ]
  }
  ```

#### Contest List with Currency
- **Endpoint**: `GET /api/v1/contests?currency=kes`
- Returns all contests with fiat conversion
- **Display Priority**: Fiat amount in large text, Rc amount below in smaller text

#### Contest Detail with Currency
- **Endpoint**: `GET /api/v1/contests/:id?currency=kes`
- Includes full prize breakdown with currency conversion
- Shows both Rc and fiat amounts for each rank

#### Exchange Rate Logic
- Uses `ExchangeService` for real-time rates
- **Conversion**: Rc → USD → Local Currency
- **Base Rate**: 1 Rc = $100 USD
- **Formula**: `prizeRc × 100 × usdToLocalRate`

## API Endpoints Summary

### Contest Lifecycle
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/contests/:id/transition-to-judging` | POST | Creator | Manually transition to JUDGING |

### Judging & Scoring
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/contests/:id/judges/invite` | POST | Creator | Invite judges |
| `/api/v1/contests/judge/invitations` | GET | Judge | Get pending invitations |
| `/api/v1/contests/judge/invitations/:id/accept` | POST | Judge | Accept invitation |
| `/api/v1/contests/judge/invitations/:id/decline` | POST | Judge | Decline invitation |
| `/api/v1/contests/judge/assigned` | GET | Judge | Get assigned contests |
| `/api/v1/contests/submissions/:id/score` | POST | Judge | Score a submission |

### Winner Calculation
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/contests/:id/calculate-winners` | GET | Auth | Calculate winners automatically |
| `/api/v1/contests/:id/prize-breakdown` | GET | Public | Get prize breakdown with currency |

### Prize Distribution
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/contests/:id/distribute-auto` | POST | Admin | Auto-distribute based on scores |
| `/api/v1/contests/:id/distribute` | POST | Admin | Manual distribution with winner IDs |

## Database Schema

### judge_scores Table
```sql
CREATE TABLE judge_scores (
  id TEXT PRIMARY KEY,
  judge_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (judge_id) REFERENCES contest_judges(id),
  FOREIGN KEY (submission_id) REFERENCES contest_submission(id),
  UNIQUE (judge_id, submission_id)
);
```

### ContestSubmission Fields
- `judge_score`: Average of all judge scores (Decimal 5,2)
- `final_score`: Calculated based on judging criteria (Decimal 7,2)
- `rank`: Winner rank (1, 2, 3, etc.)

### Contest Fields
- `judging_criteria`: CREATOR_PICKS | COMMUNITY_VOTE | MOST_ENGAGEMENT | COMBINATION
- `public_vote_weight`: 0-100 (used in COMBINATION mode)
- `status`: ACTIVE | JUDGING | COMPLETED

## Workflow Example

### Complete Contest Lifecycle

1. **Contest Creation**
   ```javascript
   POST /api/v1/contests
   {
     "title": "Best Dance Video",
     "prizeTotalKr": 1000,
     "maxWinners": 3,
     "prizeDistribution": [
       { "rank": 1, "percentage": 50 },
       { "rank": 2, "percentage": 30 },
       { "rank": 3, "percentage": 20 }
     ],
     "judgingCriteria": "COMBINATION",
     "publicVoteWeight": 40,
     "deadline": "2026-06-01T00:00:00Z"
   }
   ```
   - Creator pays: Rc 1,150 (1000 + 15% fee)

2. **Invite Judges**
   ```javascript
   POST /api/v1/contests/:id/judges/invite
   {
     "judgeIds": ["judge-1-id", "judge-2-id"]
   }
   ```

3. **Participants Submit Entries**
   ```javascript
   POST /api/v1/contests/:id/submit
   {
     "media_url": "https://...",
     "media_type": "VIDEO"
   }
   ```

4. **Community Votes** (during ACTIVE status)
   ```javascript
   POST /api/v1/contests/submissions/:id/vote
   {
     "voteType": "UPVOTE"
   }
   ```

5. **Automatic Transition to JUDGING**
   - Worker runs every 5 minutes
   - Checks for expired contests
   - Updates status to JUDGING

6. **Judges Score Submissions**
   ```javascript
   POST /api/v1/contests/submissions/:id/score
   {
     "score": 85,
     "feedback": "Excellent choreography"
   }
   ```

7. **Calculate Winners**
   ```javascript
   GET /api/v1/contests/:id/calculate-winners
   ```
   - Returns ranked winners with scores

8. **Distribute Prizes**
   ```javascript
   POST /api/v1/contests/:id/distribute-auto
   ```
   - Rank 1: Rc 500 (50%)
   - Rank 2: Rc 300 (30%)
   - Rank 3: Rc 200 (20%)

9. **Winners Receive Prizes**
   - Wallets credited automatically
   - Transactions recorded
   - Escrow released
   - Contest status → COMPLETED

## Frontend Integration

### Display Prize with Currency
```javascript
// Fetch contest with user's currency
const response = await fetch(
  `/api/v1/contests/${contestId}?currency=${userCurrency}`
);
const contest = await response.json();

// Display format:
// Large text: KES 14,000,000
// Small text below: Rc 1,000
```

### Prize Breakdown Display
```javascript
const breakdown = await fetch(
  `/api/v1/contests/${contestId}/prize-breakdown?currency=kes`
);

// Show for each rank:
// 1st Place: KES 7,000,000 (Rc 500) - 50%
// 2nd Place: KES 4,200,000 (Rc 300) - 30%
// 3rd Place: KES 2,800,000 (Rc 200) - 20%
```

## Testing

### Test Scenarios

1. **Airdrop Fee Calculation**
   - Create contest with airdrops
   - Verify total charged includes 15% fee on airdrops

2. **Automatic Transition**
   - Create contest with past deadline
   - Wait 5 minutes
   - Verify status changes to JUDGING

3. **Judge Scoring**
   - Invite judges
   - Judges score submissions
   - Verify average judge score calculated correctly

4. **Winner Calculation - COMBINATION**
   - Create contest with COMBINATION criteria
   - Add judge scores and public votes
   - Verify final score = (judge × 60%) + (votes × 40%)

5. **Prize Distribution**
   - Set percentages: 50%, 30%, 20%
   - Distribute prizes
   - Verify each winner receives correct amount

6. **Currency Conversion**
   - Fetch contest with currency=kes
   - Verify fiat amounts calculated correctly
   - Check exchange rate applied properly

## Migration

To apply the judge_scores table:

```bash
# Run the migration SQL
psql $DATABASE_URL -f backend/prisma/migrations/add_judge_scores_table.sql

# Or regenerate Prisma client
npx prisma generate
```

## Notes

- All monetary calculations use Decimal type for precision
- Exchange rates cached for 5 minutes
- Worker logs all transitions for audit trail
- Prize distribution is atomic (all or nothing)
- Escrow ensures funds are held until distribution
