# Contest Publish Button Fix

## Problem
When clicking the "Publish Contest" button, it showed "Something went wrong. Please try again." error. The contest was not being created.

## Root Cause
**Frontend-Backend Response Mismatch**: The backend API returns `contest_id` (snake_case), but the frontend DTO expected `contestId` (camelCase) without proper serialization mapping.

## Solution
Added `@kotlinx.serialization.SerialName` annotation to properly map the backend's snake_case response to frontend's camelCase property.

### Changed File
- `composeApp/src/commonMain/kotlin/com/runinga/feature/contests/data/remote/dto/ContestsDtos.kt`

### Change Made
```kotlin
@Serializable
data class CreateContestResponseDto(
    @kotlinx.serialization.SerialName("contest_id")  // ✅ Added this annotation
    val contestId: String? = null,
    val message: String? = null,
    val error: String? = null
)
```

## Money Flow When Contest is Published

### What Happens When User Clicks "Publish Contest"

1. **Frontend Validation** (before API call):
   - Checks wallet balance has enough Rc
   - Total cost = Prize Pool + 15% platform fee
   - Shows error if insufficient balance

2. **Backend Creates Contest** (`ContestService.createContest`):
   ```
   Total Deduction = Prize Pool + Platform Fee (15%)
   
   Example:
   - Prize Pool: Rc.1000
   - Platform Fee: Rc.150 (15%)
   - Total Deducted: Rc.1150
   ```

3. **Money is Deducted from Creator's Wallet**:
   - Happens in a database transaction (atomic operation)
   - Creator's wallet: `kr_balance` is decremented by total amount
   - Transaction type: `contest_escrow`

4. **Money Goes to Escrow (Platform-Held Funds)**:
   - Stored in `escrows` table with status `'held'`
   - Linked to the contest via `contest_id`
   - Breakdown:
     - `prize_amount_kr`: The actual prize pool for winners
     - `fee_amount_kr`: The 15% platform fee
     - `status`: `'held'` (locked until contest completes)

5. **Escrow Record Created**:
   ```sql
   INSERT INTO escrows (
     contest_id,
     user_id,           -- contest creator
     prize_amount_kr,   -- Rc.1000
     fee_amount_kr,     -- Rc.150
     status             -- 'held'
   )
   ```

### Where the Money Goes

#### During Contest (Active)
- **Creator's Wallet**: Money is GONE (already deducted)
- **Escrow Table**: Money is HELD (status = 'held')
- **Winners' Wallets**: No money yet

#### After Contest Completes & Winners Chosen
When `distributeContestPrizes()` is called:

1. **Winners Receive Prize Money**:
   - Money is transferred from escrow to winners' wallets
   - Distribution based on prize percentages (e.g., 1st: 50%, 2nd: 30%, 3rd: 20%)
   - Transaction type: `contest_prize`

2. **Platform Fee Retained**:
   - The 15% platform fee stays with the platform
   - Used for operational costs
   - NOT returned to creator or winners

3. **Escrow Status Changed**:
   - Status updated from `'held'` to `'released'`
   - Contest status updated to `'COMPLETED'`

### Example Money Flow

**Before Contest Creation:**
```
Creator Wallet: Rc.2000
Platform Escrow: Rc.0
Winner A Wallet: Rc.0
Winner B Wallet: Rc.0
```

**After Contest Creation (Prize Pool: Rc.1000):**
```
Creator Wallet: Rc.850 (deducted Rc.1150)
Platform Escrow: Rc.1150 (held)
  - Prize Pool: Rc.1000
  - Platform Fee: Rc.150
Winner A Wallet: Rc.0
Winner B Wallet: Rc.0
```

**After Contest Completion (2 winners: 60%/40% split):**
```
Creator Wallet: Rc.850 (no change)
Platform Escrow: Rc.150 (fee retained)
Winner A Wallet: Rc.600 (60% of Rc.1000)
Winner B Wallet: Rc.400 (40% of Rc.1000)
Platform Revenue: Rc.150 (15% fee)
```

## Additional Features in Contest Creation

### Prize Pool Calculation
The backend calculates total escrow amount including:
- Base prize pool
- Daily prizes (if enabled): `dailyPrizeRc × durationDays + 15% fee`
- Milestone airdrops (if enabled): `airdropRc × airdropLimit + 15% fee`

### Entry Fees
If contest has entry fees:
- Participants pay to join
- Entry fees are added to the prize pool
- Platform still takes 15% of the total final prize pool

### What Happens if Contest is Cancelled?
Currently, there's no cancellation mechanism in the code. To implement:
1. Need to add `cancelContest()` method
2. Refund creator from escrow (minus a cancellation fee?)
3. Update escrow status to `'refunded'`

## Security & Compliance Notes

1. **Atomic Transactions**: All wallet deductions and escrow creation happen in a single database transaction
2. **Insufficient Balance Check**: Frontend and backend both validate balance before proceeding
3. **Escrow Integrity**: Money is always accounted for - either in wallet or escrow
4. **15% Platform Fee**: Applied consistently to all prize-related amounts
5. **Audit Trail**: All money movements recorded in `transactions` table

## Testing Checklist

- [x] Contest creation successfully deducts wallet balance
- [x] Escrow record is created with correct amounts
- [x] Transaction record is created with type 'contest_escrow'
- [x] Frontend shows correct Rc to fiat conversion
- [x] Error handling for insufficient balance
- [x] Response mapping between backend and frontend
- [ ] Contest completion and prize distribution (not modified in this fix)
- [ ] Platform fee accounting
- [ ] Refund mechanism (if cancelled)

## Related Files

### Backend
- `backend/src/modules/contests/contests.service.ts` - Contest creation logic
- `backend/src/modules/contests/contests.routes.ts` - API endpoint
- `backend/prisma/schema.prisma` - Database schema (escrows table)

### Frontend
- `composeApp/.../contests/data/remote/dto/ContestsDtos.kt` - API DTOs
- `composeApp/.../contests/data/repository/ContestsRepositoryImpl.kt` - Repository
- `composeApp/.../contests/presentation/viewmodel/CreateContestViewModel.kt` - ViewModel
- `composeApp/.../contests/presentation/screen/wizard/Step5ReviewAndJudges.kt` - Publish button UI

## Future Improvements

1. **Cancellation Feature**: Allow contest creators to cancel and get refund (with penalty)
2. **Partial Refunds**: If not enough participants, refund a portion
3. **Escrow Dashboard**: Show creators their escrowed funds
4. **Prize Distribution Automation**: Auto-distribute when deadline passes
5. **Fee Transparency**: Show breakdown of where money goes in UI
