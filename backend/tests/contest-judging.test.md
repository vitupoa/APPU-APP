# Contest Judging System - Manual Test Guide

## Prerequisites
- Backend server running
- Database migrated with judge_scores table
- Test user accounts (creator, judges, participants)
- Admin account for prize distribution

## Test 1: Airdrop Fee Calculation

### Steps:
1. Create a contest with airdrops:
```bash
POST /api/v1/contests
{
  "title": "Test Contest with Airdrops",
  "description": "Testing airdrop fee calculation",
  "media_type": "PHOTO",
  "category": "CREATIVE",
  "prizeTotalKr": 1000,
  "maxWinners": 1,
  "prizeDistribution": [{ "rank": 1, "percentage": 100 }],
  "judgingCriteria": "COMMUNITY_VOTE",
  "deadline": "2026-12-31T23:59:59Z",
  "participationType": "INDIVIDUAL_ONLY",
  "airdropKr": 10,
  "airdropLimit": 100
}
```

### Expected Result:
- Prize: Rc 1,000
- Prize fee (15%): Rc 150
- Airdrop pool: Rc 1,000 (10 × 100)
- Airdrop fee (15%): Rc 150
- **Total charged: Rc 2,300**

### Verification:
- Check creator wallet deduction
- Check escrow record
- Verify platform_fee_kr includes both fees

---

## Test 2: Automatic Transition to JUDGING

### Steps:
1. Create a contest with past deadline:
```bash
POST /api/v1/contests
{
  "title": "Expired Contest",
  "description": "Testing auto transition",
  "media_type": "PHOTO",
  "category": "CREATIVE",
  "prizeTotalKr": 100,
  "maxWinners": 1,
  "prizeDistribution": [{ "rank": 1, "percentage": 100 }],
  "judgingCriteria": "COMMUNITY_VOTE",
  "deadline": "2020-01-01T00:00:00Z",  // Past date
  "participationType": "INDIVIDUAL_ONLY"
}
```

2. Wait 5 minutes (or check worker logs)

### Expected Result:
- Contest status changes from ACTIVE to JUDGING
- Worker logs show: "Contest transitioned to JUDGING"

### Verification:
```bash
GET /api/v1/contests/:contestId
```
- Verify `status: "JUDGING"`

---

## Test 3: Judge Scoring

### Steps:
1. Create contest (future deadline)
2. Invite judges:
```bash
POST /api/v1/contests/:contestId/judges/invite
{
  "judgeIds": ["judge-user-id-1", "judge-user-id-2"]
}
```

3. Judges accept invitations:
```bash
POST /api/v1/contests/judge/invitations/:inviteId/accept
```

4. Participants submit entries:
```bash
POST /api/v1/contests/:contestId/submit
{
  "media_url": "https://example.com/image.jpg",
  "media_type": "PHOTO"
}
```

5. Manually transition to JUDGING:
```bash
POST /api/v1/contests/:contestId/transition-to-judging
```

6. Judges score submissions:
```bash
POST /api/v1/contests/submissions/:submissionId/score
{
  "score": 85,
  "feedback": "Excellent work!"
}
```

### Expected Result:
- Judge score recorded in judge_scores table
- Submission judge_score updated (average of all judge scores)
- Final score calculated based on judging criteria

### Verification:
```bash
GET /api/v1/contests/:contestId/submissions
```
- Check `judge_score` and `final_score` fields

---

## Test 4: COMBINATION Judging Criteria

### Setup:
- Contest with `judgingCriteria: "COMBINATION"`
- `publicVoteWeight: 40` (judges 60%, votes 40%)

### Steps:
1. Create contest with COMBINATION criteria
2. Get 2 submissions:
   - Submission A: Judge score 80, Votes 50
   - Submission B: Judge score 60, Votes 100

3. Calculate expected final scores:
   - Submission A: (80 × 0.6) + (min(50/10, 100) × 0.4) = 48 + 2 = 50
   - Submission B: (60 × 0.6) + (min(100/10, 100) × 0.4) = 36 + 4 = 40

### Expected Result:
- Submission A wins (higher final score)

### Verification:
```bash
GET /api/v1/contests/:contestId/calculate-winners
```
- Verify Submission A is rank 1

---

## Test 5: Prize Distribution with Percentages

### Steps:
1. Create contest with 3 winners:
```bash
{
  "prizeTotalKr": 1000,
  "maxWinners": 3,
  "prizeDistribution": [
    { "rank": 1, "percentage": 50 },
    { "rank": 2, "percentage": 30 },
    { "rank": 3, "percentage": 20 }
  ]
}
```

2. Get 3 submissions with different scores
3. Calculate winners:
```bash
GET /api/v1/contests/:contestId/calculate-winners
```

4. Distribute prizes (admin):
```bash
POST /api/v1/contests/:contestId/distribute-auto
```

### Expected Result:
- Rank 1: Rc 500 (50%)
- Rank 2: Rc 300 (30%)
- Rank 3: Rc 200 (20%)

### Verification:
- Check winner wallets
- Check transactions table
- Check contest_winners table
- Verify escrow status = 'released'
- Verify contest status = 'COMPLETED'

---

## Test 6: Currency Conversion

### Steps:
1. Get contest with currency parameter:
```bash
GET /api/v1/contests/:contestId?currency=kes
```

2. Get prize breakdown:
```bash
GET /api/v1/contests/:contestId/prize-breakdown?currency=kes
```

### Expected Result:
```json
{
  "totalPrizeKr": 1000,
  "totalPrizeFiat": 14000000,  // Approximate, depends on exchange rate
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

### Verification:
- Verify fiat amounts are reasonable
- Check exchange rate is applied correctly
- Test with different currencies (USD, EUR, GBP)

---

## Test 7: Percentage Validation

### Steps:
1. Try to create contest with invalid percentages:
```bash
POST /api/v1/contests
{
  "prizeDistribution": [
    { "rank": 1, "percentage": 50 },
    { "rank": 2, "percentage": 30 }
    // Total = 80%, should fail
  ]
}
```

### Expected Result:
- Error: "Prize distribution percentages must sum to 100%"

### Verification:
- Contest not created
- Error message returned

---

## Test 8: Judge Authorization

### Steps:
1. Try to score submission as non-judge:
```bash
POST /api/v1/contests/submissions/:submissionId/score
{
  "score": 90
}
```

### Expected Result:
- Error: "You are not authorized to judge this contest"

### Verification:
- Score not recorded
- Error returned

---

## Test 9: Manual vs Automatic Distribution

### Test 9a: Automatic Distribution
```bash
POST /api/v1/contests/:contestId/distribute-auto
```
- Winners calculated automatically
- Prizes distributed based on scores

### Test 9b: Manual Distribution
```bash
POST /api/v1/contests/:contestId/distribute
{
  "winnerIds": ["user-1", "user-2", "user-3"]
}
```
- Specific users selected as winners
- Prizes distributed based on percentages

### Verification:
- Both methods use percentage distribution
- Both methods credit wallets correctly
- Both methods record transactions

---

## Test 10: Contest List with Currency

### Steps:
```bash
GET /api/v1/contests?currency=kes&limit=10
```

### Expected Result:
```json
{
  "items": [
    {
      "id": "...",
      "title": "...",
      "prizeTotalKr": 1000,
      "prizeTotalFiat": 14000000,
      "currency": "KES",
      ...
    }
  ]
}
```

### Verification:
- All contests show fiat amounts
- Currency field present
- Amounts calculated correctly

---

## Performance Tests

### Test 11: Worker Performance
1. Create 100 contests with past deadlines
2. Wait for worker to run
3. Check logs for processing time
4. Verify all contests transitioned

### Test 12: Score Recalculation
1. Create contest with 10 submissions
2. Have 5 judges score all submissions
3. Measure time for score recalculation
4. Verify all scores updated correctly

---

## Edge Cases

### Test 13: Tie Scores
- Create 2 submissions with same final score
- Verify earlier submission wins (tiebreaker)

### Test 14: No Judges
- Contest with CREATOR_PICKS but no judges invited
- Verify manual distribution still works

### Test 15: Zero Votes
- Submission with judge scores but no votes
- Verify COMBINATION calculation handles zero votes

### Test 16: Exchange Rate Failure
- Mock exchange service failure
- Verify graceful fallback (Rc amounts only)

---

## Cleanup

After testing:
1. Delete test contests
2. Remove test users
3. Clear test transactions
4. Reset test wallets

---

## Success Criteria

All tests should pass with:
- ✅ Correct fee calculations
- ✅ Automatic status transitions
- ✅ Accurate score calculations
- ✅ Proper prize distributions
- ✅ Correct currency conversions
- ✅ Appropriate error handling
- ✅ Secure authorization checks
