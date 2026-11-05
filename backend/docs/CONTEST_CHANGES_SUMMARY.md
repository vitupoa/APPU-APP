# Contest System Changes Summary

## Overview
This document summarizes all changes made to implement the complete contest judging system, fix airdrop fees, and add currency conversion for prize display.

## Files Modified

### 1. Database Schema (`backend/prisma/schema.prisma`)
**Changes:**
- Added `judge_scores` table with relations to `contest_judges` and `ContestSubmission`
- Added `judge_scores` relation to `ContestSubmission` model
- Added `judge_scores` relation to `contest_judges` model

**New Table:**
```prisma
model judge_scores {
  id            String            @id @default(uuid())
  judge_id      String
  submission_id String
  score         Decimal           @db.Decimal(5, 2)
  feedback      String?
  created_at    DateTime          @default(now())
  updated_at    DateTime          @updatedAt
  judge         contest_judges    @relation(fields: [judge_id], references: [id], onDelete: Cascade)
  submission    ContestSubmission @relation(fields: [submission_id], references: [id], onDelete: Cascade)

  @@unique([judge_id, submission_id])
  @@index([submission_id])
  @@map("judge_scores")
}
```

### 2. Contest Service (`backend/src/modules/contests/contests.service.ts`)
**Changes:**

#### Fixed Airdrop Fee Calculation
```typescript
// OLD (Missing airdrop fees)
const totalChargedRc = new Prisma.Decimal(
  data.prizeTotalRc + platformFeeRc + totalDailyPrizePool + airdropTotalPool
);

// NEW (Includes 15% fee on airdrops and daily prizes)
const dailyPrizePlatformFee = totalDailyPrizePool * PLATFORM_FEE_RATE;
const airdropPlatformFee = airdropTotalPool * PLATFORM_FEE_RATE;

const totalChargedRc = new Prisma.Decimal(
  data.prizeTotalRc + platformFeeRc + 
  totalDailyPrizePool + dailyPrizePlatformFee + 
  airdropTotalPool + airdropPlatformFee
);
```

#### New Methods Added
1. **`transitionToJudging(contestId, creatorId?)`**
   - Transitions contest from ACTIVE to JUDGING
   - Can be called manually by creator or automatically by worker

2. **`scoreSubmission(judgeUserId, submissionId, score, feedback?)`**
   - Allows judges to score submissions
   - Validates judge authorization
   - Recalculates submission scores

3. **`recalculateSubmissionScores(submissionId)`**
   - Calculates average judge score
   - Calculates final score based on judging criteria
   - Implements COMBINATION algorithm

4. **`calculateWinners(contestId)`**
   - Automatically determines winners based on final scores
   - Updates submission ranks
   - Returns winner details

5. **`distributeContestPrizes(contestId, winnerIds?)`** (Modified)
   - Now supports automatic winner calculation if no IDs provided
   - Uses prize distribution percentages properly
   - Validates percentages sum to 100%

6. **`creditWinner(tx, winnerId, contestId, rank, prizeAmount)`** (New Helper)
   - Atomic winner crediting
   - Records transactions
   - Unlocks winner wallet

7. **`getPrizeBreakdown(contestId, userCurrency)`**
   - Returns prize amounts in Rc and user's local currency
   - Uses real-time exchange rates

8. **`listContests(params)`** (Modified)
   - Added `userCurrency` parameter
   - Returns prizes in both Rc and fiat currency

9. **`getContestById(contestId, userId?, userCurrency?)`** (Modified)
   - Added `userCurrency` parameter
   - Includes prize breakdown with currency conversion
   - Returns prize distributions

### 3. Contest Routes (`backend/src/modules/contests/contests.routes.ts`)
**New Endpoints:**

```typescript
// Transition to judging
POST /api/v1/contests/:id/transition-to-judging

// Judge scoring
POST /api/v1/contests/submissions/:submissionId/score
Body: { score: number, feedback?: string }

// Calculate winners
GET /api/v1/contests/:id/calculate-winners

// Prize breakdown with currency
GET /api/v1/contests/:id/prize-breakdown?currency=kes

// Automatic distribution
POST /api/v1/contests/:id/distribute-auto
```

**Modified Endpoints:**
```typescript
// Now accepts currency parameter
GET /api/v1/contests?currency=kes
GET /api/v1/contests/:id?currency=kes

// Now supports optional winnerIds (auto-calculates if not provided)
POST /api/v1/contests/:id/distribute
Body: { winnerIds?: string[] }
```

### 4. Contest Deadline Worker (`backend/src/workers/contestDeadline.worker.ts`)
**New File:**
- Runs every 5 minutes
- Automatically transitions expired contests to JUDGING
- Logs all transitions for audit trail

### 5. Main Server (`backend/src/index.ts`)
**Changes:**
- Imported `startContestDeadlineWorker`
- Added worker to startup sequence

### 6. Migration Files
**New Files:**
- `backend/prisma/migrations/add_judge_scores_table.sql` - Manual migration for judge_scores table

### 7. Documentation
**New Files:**
- `backend/docs/CONTEST_JUDGING.md` - Complete system documentation
- `backend/docs/CONTEST_CHANGES_SUMMARY.md` - This file

## Feature Implementation Status

### ✅ Completed Features

1. **Airdrop Fee Calculation** - FIXED
   - Platform now charges 15% on airdrops
   - Platform charges 15% on daily prizes
   - Total fee calculation includes all components

2. **Automatic Contest Transition** - IMPLEMENTED
   - Worker runs every 5 minutes
   - Automatically moves ACTIVE → JUDGING when deadline passes
   - Manual transition available for creators

3. **Judge Scoring System** - IMPLEMENTED
   - Judge invitation and acceptance flow
   - Score submission API (0-100 scale)
   - Average judge score calculation
   - Feedback support

4. **Judging Criteria Implementation** - IMPLEMENTED
   - CREATOR_PICKS: Manual selection with judge scores
   - COMMUNITY_VOTE: Based on vote count
   - MOST_ENGAGEMENT: Based on engagement metrics
   - COMBINATION: Weighted algorithm (judge scores + public votes)

5. **Winner Calculation** - IMPLEMENTED
   - Automatic calculation based on final scores
   - Rank assignment
   - Tiebreaker logic (earlier submission wins)

6. **Prize Distribution** - IMPLEMENTED
   - Percentage-based distribution
   - Validation (must sum to 100%)
   - Automatic and manual modes
   - Atomic transactions

7. **Currency Conversion** - IMPLEMENTED
   - Real-time exchange rates
   - Prize display in user's local currency
   - Fiat-first display (Rc secondary)
   - Prize breakdown API

## API Changes Summary

### New Endpoints (7)
1. `POST /api/v1/contests/:id/transition-to-judging`
2. `POST /api/v1/contests/submissions/:submissionId/score`
3. `GET /api/v1/contests/:id/calculate-winners`
4. `GET /api/v1/contests/:id/prize-breakdown`
5. `POST /api/v1/contests/:id/distribute-auto`

### Modified Endpoints (3)
1. `GET /api/v1/contests` - Added currency parameter
2. `GET /api/v1/contests/:id` - Added currency parameter
3. `POST /api/v1/contests/:id/distribute` - Made winnerIds optional

### Existing Endpoints (Unchanged)
- All judge invitation endpoints remain the same
- All submission and voting endpoints remain the same

## Database Changes

### New Tables (1)
- `judge_scores` - Stores individual judge scores for submissions

### Modified Tables (0)
- No existing tables were modified
- All new fields were already present in schema

## Breaking Changes

### None
All changes are backward compatible:
- Existing endpoints still work with same parameters
- New parameters are optional
- Old prize distribution logic still works (falls back to equal distribution)

## Migration Steps

1. **Apply Database Migration:**
   ```bash
   psql $DATABASE_URL -f backend/prisma/migrations/add_judge_scores_table.sql
   ```

2. **Regenerate Prisma Client:**
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Restart Server:**
   - Worker will automatically start
   - New endpoints will be available

4. **Verify:**
   - Check worker logs for "Contest deadline worker started"
   - Test new endpoints
   - Verify currency conversion works

## Testing Checklist

- [ ] Airdrop fee calculation includes 15% platform fee
- [ ] Daily prize fee calculation includes 15% platform fee
- [ ] Contest automatically transitions to JUDGING after deadline
- [ ] Judges can score submissions
- [ ] Average judge score calculated correctly
- [ ] Final score calculated correctly for each judging criteria
- [ ] Winners calculated automatically based on scores
- [ ] Prize distribution uses percentages correctly
- [ ] Percentages validation (must sum to 100%)
- [ ] Currency conversion returns correct fiat amounts
- [ ] Prize breakdown API works with all currencies
- [ ] Contest list shows fiat amounts when currency provided
- [ ] Contest detail shows prize breakdown with currency

## Performance Considerations

1. **Worker Frequency**: Runs every 5 minutes (configurable)
2. **Exchange Rate Caching**: 5-minute cache (from ExchangeService)
3. **Score Recalculation**: Only when judge scores change
4. **Database Queries**: Optimized with proper indexes

## Security Considerations

1. **Judge Authorization**: Verified before allowing scoring
2. **Admin-Only Distribution**: Prize distribution requires admin auth
3. **Atomic Transactions**: All prize distributions are atomic
4. **Escrow System**: Funds held until distribution
5. **Validation**: All inputs validated with Zod schemas

## Future Enhancements

Potential improvements for future iterations:

1. **Engagement Metrics**: Extend MOST_ENGAGEMENT to include comments, shares
2. **Judge Weights**: Allow different weights for different judges
3. **Partial Scoring**: Allow judges to score only some submissions
4. **Score History**: Track score changes over time
5. **Notification System**: Notify judges when assigned, winners when prizes distributed
6. **Analytics Dashboard**: Show judging progress, score distributions
7. **Dispute Resolution**: Handle score disputes or appeals

## Support

For questions or issues:
- See full documentation: `backend/docs/CONTEST_JUDGING.md`
- Check API endpoints in routes file
- Review service methods for implementation details
