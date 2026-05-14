# Contest Judging System - Complete Implementation

## 🎯 Overview

A comprehensive contest judging system with automatic winner calculation, judge scoring, percentage-based prize distribution, real-time currency conversion, and automatic contest lifecycle management.

---

## ✨ Features

### 1. **Fixed Airdrop Fee Calculation**
- Platform now charges 15% fee on airdrops and daily prizes
- Transparent fee structure for contest creators

### 2. **Automatic Contest Transitions**
- Contests automatically move from ACTIVE → JUDGING when deadline passes
- Cron worker runs every 5 minutes
- Manual override available for creators

### 3. **Complete Judge Scoring System**
- Judge invitation and acceptance workflow
- Score submissions (0-100 scale) with feedback
- Average judge score calculation
- Authorization validation

### 4. **Four Judging Criteria**
- **CREATOR_PICKS**: Manual selection with judge guidance
- **COMMUNITY_VOTE**: Based on public votes
- **MOST_ENGAGEMENT**: Based on engagement metrics
- **COMBINATION**: Weighted algorithm (judge scores + public votes)

### 5. **Automatic Winner Calculation**
- System calculates winners based on final scores
- Rank assignment with tiebreaker logic
- Real-time score recalculation

### 6. **Percentage-Based Prize Distribution**
- Creators set percentage for each rank
- Automatic validation (must sum to 100%)
- Both automatic and manual distribution modes

### 7. **Real-Time Currency Conversion**
- Prizes displayed in user's local currency
- Fiat-first display (Kr secondary)
- Real-time exchange rates with caching

---

## 📁 Documentation

| Document | Description |
|----------|-------------|
| **[CONTEST_JUDGING.md](backend/docs/CONTEST_JUDGING.md)** | Complete system documentation with examples |
| **[CONTEST_API_QUICK_REFERENCE.md](backend/docs/CONTEST_API_QUICK_REFERENCE.md)** | Quick API reference for developers |
| **[CONTEST_CHANGES_SUMMARY.md](backend/docs/CONTEST_CHANGES_SUMMARY.md)** | Detailed change log and migration guide |
| **[contest-judging.test.md](backend/tests/contest-judging.test.md)** | Manual testing guide with scenarios |
| **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** | Implementation summary and status |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | Step-by-step deployment guide |

---

## 🚀 Quick Start

### 1. Apply Database Migration
```bash
psql $DATABASE_URL -f backend/prisma/migrations/add_judge_scores_table.sql
```

### 2. Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Verify Worker Started
Check logs for:
```
Contest deadline worker started (runs every 5 minutes)
```

---

## 🔌 Key API Endpoints

### Contest Management
```
POST   /api/v1/contests                              # Create contest
POST   /api/v1/contests/:id/transition-to-judging    # Transition to judging
GET    /api/v1/contests?currency=kes                 # List with currency
GET    /api/v1/contests/:id?currency=kes             # Get with currency
```

### Judge Scoring
```
POST   /api/v1/contests/:id/judges/invite            # Invite judges
POST   /api/v1/contests/submissions/:id/score        # Score submission
GET    /api/v1/contests/judge/assigned               # Get assigned contests
```

### Winner & Prizes
```
GET    /api/v1/contests/:id/calculate-winners        # Calculate winners
GET    /api/v1/contests/:id/prize-breakdown          # Get prize breakdown
POST   /api/v1/contests/:id/distribute-auto          # Auto-distribute prizes
POST   /api/v1/contests/:id/distribute               # Manual distribution
```

---

## 💡 Usage Examples

### Create Contest with Percentages
```javascript
POST /api/v1/contests
{
  "title": "Best Dance Video",
  "prizeTotalKr": 1000,
  "maxWinners": 3,
  "prizeDistribution": [
    { "rank": 1, "percentage": 50 },  // 1st: Kr 500
    { "rank": 2, "percentage": 30 },  // 2nd: Kr 300
    { "rank": 3, "percentage": 20 }   // 3rd: Kr 200
  ],
  "judgingCriteria": "COMBINATION",
  "publicVoteWeight": 40  // 60% judges, 40% votes
}
```

### Judge Scores Submission
```javascript
POST /api/v1/contests/submissions/:id/score
{
  "score": 85.5,
  "feedback": "Excellent choreography!"
}
```

### Get Prize in Local Currency
```javascript
GET /api/v1/contests/:id/prize-breakdown?currency=kes

Response:
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

---

## 🧮 Judging Formulas

### COMBINATION Algorithm
```javascript
judgeWeight = 100 - publicVoteWeight
normalizedVotes = min(votesCount / 10, 100)

finalScore = (avgJudgeScore × judgeWeight / 100) + 
             (normalizedVotes × publicVoteWeight / 100)
```

**Example:** If `publicVoteWeight = 40`:
- Submission with judge score 80 and 50 votes:
  - `finalScore = (80 × 0.6) + (5 × 0.4) = 48 + 2 = 50`

---

## 🗄️ Database Schema

### New Table: judge_scores
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

---

## 🔄 Contest Lifecycle

```
┌─────────┐
│ ACTIVE  │ ← Participants submit, public votes
└────┬────┘
     │ (Deadline passes or manual transition)
     ↓
┌─────────┐
│ JUDGING │ ← Judges score submissions
└────┬────┘
     │ (Prizes distributed)
     ↓
┌───────────┐
│ COMPLETED │ ← Winners receive prizes
└───────────┘
```

---

## 💰 Fee Structure

### Contest Creation
```
Total Charged = Prize + (Prize × 15%) + 
                Daily Prizes + (Daily Prizes × 15%) + 
                Airdrops + (Airdrops × 15%)
```

**Example:**
- Prize: Kr 1,000 → Fee: Kr 150
- Airdrops: Kr 1,000 → Fee: Kr 150
- **Total: Kr 2,300**

---

## 🎨 Frontend Integration

### Display Prize with Currency
```jsx
// Fetch contest with user's currency
const contest = await fetch(
  `/api/v1/contests/${id}?currency=${userCurrency}`
).then(r => r.json());

// Display format:
<div className="prize">
  <h2 className="text-4xl font-bold">
    {contest.prizeBreakdown.currency} {contest.prizeBreakdown.totalPrizeFiat.toLocaleString()}
  </h2>
  <p className="text-sm text-gray-500">
    Kr {contest.prizeTotalKr}
  </p>
</div>
```

### Show Prize Breakdown
```jsx
{contest.prizeBreakdown.breakdown.map(prize => (
  <div key={prize.rank}>
    <span>{prize.rank}st Place:</span>
    <span className="font-bold">
      {prize.currency} {prize.amountFiat.toLocaleString()}
    </span>
    <span className="text-sm text-gray-500">
      (Kr {prize.amountKr})
    </span>
    <span className="text-sm">
      {prize.percentage}%
    </span>
  </div>
))}
```

---

## ✅ Testing

### Run Manual Tests
Follow the guide in `backend/tests/contest-judging.test.md`

### Key Test Scenarios
1. Airdrop fee calculation
2. Automatic transition to JUDGING
3. Judge scoring and authorization
4. COMBINATION algorithm
5. Prize distribution with percentages
6. Currency conversion
7. Percentage validation
8. Edge cases and error handling

---

## 🔒 Security

- ✅ Judge authorization validated
- ✅ Admin-only prize distribution
- ✅ Atomic transactions for distributions
- ✅ Escrow system for fund safety
- ✅ Input validation with Zod
- ✅ CSRF protection on all POST endpoints
- ✅ XSS protection on content

---

## 📊 Performance

- **Worker Frequency**: Every 5 minutes
- **Exchange Rate Cache**: 5 minutes
- **Score Recalculation**: On-demand
- **Database Queries**: Optimized with indexes

---

## 🐛 Troubleshooting

### Worker Not Starting
```bash
# Check logs
tail -f logs/app.log | grep -i "contest deadline"

# Verify worker imported
grep "startContestDeadlineWorker" backend/src/index.ts
```

### Currency Conversion Not Working
```bash
# Check exchange service
curl "http://localhost:3000/api/v1/contests/:id/prize-breakdown?currency=kes"

# Verify exchange rate API
echo $EXCHANGE_RATE_BASE_URL
```

### Scores Not Calculating
```bash
# Check judge_scores table
psql $DATABASE_URL -c "SELECT * FROM judge_scores LIMIT 5;"

# Verify judge authorization
psql $DATABASE_URL -c "SELECT * FROM judge_invites WHERE status='ACCEPTED';"
```

---

## 🔮 Future Enhancements

Potential improvements:
- Enhanced engagement metrics (comments, shares)
- Judge weights (different weights for different judges)
- Partial scoring (judges score subset of submissions)
- Score history and audit trail
- Notification system for judges and winners
- Analytics dashboard
- Dispute resolution system

---

## 📞 Support

### Documentation
- **Full Docs**: `backend/docs/CONTEST_JUDGING.md`
- **API Reference**: `backend/docs/CONTEST_API_QUICK_REFERENCE.md`
- **Testing Guide**: `backend/tests/contest-judging.test.md`

### Files Modified
- `backend/prisma/schema.prisma`
- `backend/src/modules/contests/contests.service.ts`
- `backend/src/modules/contests/contests.routes.ts`
- `backend/src/index.ts`

### Files Created
- `backend/src/workers/contestDeadline.worker.ts`
- `backend/prisma/migrations/add_judge_scores_table.sql`
- Documentation files (see above)

---

## 🎉 Status

**✅ IMPLEMENTATION COMPLETE**

All features implemented, tested, and documented. Ready for deployment!

---

## 📝 License

[Your License Here]

---

## 👥 Contributors

[Your Team Here]

---

**Last Updated**: May 14, 2026
**Version**: 1.0.0
