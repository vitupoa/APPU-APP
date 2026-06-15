# Tip Platform Fee Adjustment: 15% → 20%

## Change Summary
Updated the platform fee for tips from 15% to 20%, increasing platform revenue while still maintaining competitive tipping economics.

## Changes Made

### Backend: wallet.service.ts
**Location**: `backend/src/modules/wallet/wallet.service.ts`

**Changed**:
```typescript
// ❌ OLD - 15% platform fee
const PLATFORM_FEE_RATE = 0.15; // 15% Explicit Cut mapped

// ✅ NEW - 20% platform fee
const PLATFORM_FEE_RATE = 0.20; // 20% Explicit Cut mapped
```

**Updated Comments**:
- Recipient receives: 85% → 80%
- Transaction description: "Platform fee (15%)" → "Platform fee (20%)"
- Metadata fee_percentage: 15 → 20

## Impact on Tipping

### Before (15% Fee)
| Sender Tips | Platform Fee | Recipient Gets | Platform Revenue |
|-------------|--------------|----------------|------------------|
| Kr. 100     | Kr. 15       | Kr. 85         | Kr. 15           |
| Kr. 10      | Kr. 1.50     | Kr. 8.50       | Kr. 1.50         |
| Kr. 3.85    | Kr. 0.58     | Kr. 3.27       | Kr. 0.58         |

### After (20% Fee)
| Sender Tips | Platform Fee | Recipient Gets | Platform Revenue |
|-------------|--------------|----------------|------------------|
| Kr. 100     | Kr. 20       | Kr. 80         | Kr. 20           |
| Kr. 10      | Kr. 2.00     | Kr. 8.00       | Kr. 2.00         |
| Kr. 3.85    | Kr. 0.77     | Kr. 3.08       | Kr. 0.77         |

### Real-World Examples (KES)

**Example 1: KES 1000 Tip**
- Sender pays: KES 1000 (Kr. 769.23)
- Platform fee: Kr. 153.85 (~KES 200)
- Recipient gets: Kr. 615.38 (~KES 800)

**Example 2: KES 100 Tip**
- Sender pays: KES 100 (Kr. 76.92)
- Platform fee: Kr. 15.38 (~KES 20)
- Recipient gets: Kr. 61.54 (~KES 80)

**Example 3: KES 5 Tip (Small Amount)**
- Sender pays: KES 5 (Kr. 3.85)
- Platform fee: Kr. 0.77 (~KES 1)
- Recipient gets: Kr. 3.08 (~KES 4)

## Why 20%?

### Industry Comparison
- **Patreon**: 5-12% (but requires subscription)
- **Buy Me a Coffee**: 5% (excludes payment processing fees)
- **TikTok**: 50% (high but provides massive reach)
- **YouTube Super Chat**: 30% (industry standard for live tipping)
- **Twitch Bits**: 29% (similar to our model)
- **OnlyFans**: 20% (matches our new rate)

### Our Position
20% positions Krieta as:
- More competitive than TikTok and YouTube
- Aligned with OnlyFans and Twitch
- Higher than Patreon/BMC but we provide full social platform features

### Revenue Justification
Platform costs covered by 20% fee:
- **Content hosting**: Video/image storage and CDN
- **Payment processing**: Gateway fees (3-5%)
- **Infrastructure**: Servers, databases, networking
- **Moderation**: Content review and safety
- **Customer support**: User assistance
- **Development**: Feature updates and maintenance
- **Compliance**: Legal, tax, and regulatory

## Transaction Flow

### Money Movement
```
User Tips Kr. 10
  ↓
Platform Deducts Kr. 10 from Sender
  ↓
Platform Fee: Kr. 2.00 (20%)
  ↓
Recipient Receives: Kr. 8.00 (80%)
  ↓
Transaction Records:
  1. Sender: "tip_sent" -Kr. 10
  2. Recipient: "tip_received" +Kr. 8.00
  3. Platform: "platform_fee" +Kr. 2.00
```

### Database Records
```sql
-- Sender Transaction
INSERT INTO transactions (
  type: 'tip_sent',
  amount_kr: 10.00,
  status: 'completed'
)

-- Recipient Transaction
INSERT INTO transactions (
  type: 'tip_received',
  amount_kr: 8.00,  -- 80% of 10.00
  status: 'completed'
)

-- Platform Fee Transaction
INSERT INTO transactions (
  type: 'platform_fee',
  amount_kr: 2.00,  -- 20% of 10.00
  status: 'completed',
  context: {
    fee_percentage: 20,
    source_transaction: 'tip'
  }
)
```

## User Communication

### What Users Should Know
1. **Sender Pays Full Amount**: If you tip Kr. 10, you pay Kr. 10 (no hidden fees)
2. **Recipient Gets 80%**: The creator receives 80% of the tip
3. **Platform Fee is 20%**: Used to maintain and improve the platform
4. **No Additional Charges**: The 20% fee covers everything (no payment processing fees passed to users)

### UI Display
The tipping modal should show:
```
You're sending: Kr. 10
Recipient receives: Kr. 8.00 (80%)
Platform fee: Kr. 2.00 (20%)
```

Note: Currently the UI doesn't show the platform fee breakdown to keep it simple. The fee is silently deducted on the backend.

## Comparison: Contests vs Tips

| Feature | Contests | Tips |
|---------|----------|------|
| Platform Fee | 15% | 20% |
| When Charged | At contest creation | At tip send |
| Money Held In | Escrow | Direct transfer |
| Recipient Gets | 100% of prize* | 80% of tip |
| Use Case | Competitions | Instant appreciation |

*Contest fees are paid by the creator upfront, winners receive 100% of the prize pool.

## Testing Checklist

- [x] Platform fee calculation (20% of tip amount)
- [x] Recipient receives 80% of tip
- [x] Transaction records show correct fee_percentage (20)
- [x] Transaction descriptions updated
- [x] Small tips (Kr. 3.85) still work with fractional fees
- [ ] Frontend displays correct amounts (if fee shown)
- [ ] Database transactions balance correctly
- [ ] Platform revenue tracking accurate
- [ ] Test with various tip amounts (small, medium, large)

## Related Files
- `backend/src/modules/wallet/wallet.service.ts` - Tip processing logic
- `composeApp/.../wallet/domain/repository/WalletRepository.kt` - Frontend interface
- `FRACTIONAL_KR_TIPPING_FIX.md` - Previous tipping improvements
- `SMALL_FIAT_TIPPING_FIX.md` - Small amount tipping support

## Migration Notes

### No Database Migration Needed
The fee percentage is calculated dynamically in code, not stored in the database. The change is immediate upon deployment.

### Historical Transactions
- Old tips (before this change): Show 15% fee in metadata
- New tips (after this change): Show 20% fee in metadata
- Both are tracked correctly in transaction records

### Rollback Plan
If needed to revert:
```typescript
const PLATFORM_FEE_RATE = 0.15; // Revert to 15%
```
No database changes required for rollback.

## Revenue Impact Projection

### Current State (15% Fee)
- 1000 tips/day × Kr. 10 average = Kr. 10,000 volume
- Platform revenue: Kr. 1,500/day (15%)
- Creator earnings: Kr. 8,500/day (85%)

### After Change (20% Fee)
- 1000 tips/day × Kr. 10 average = Kr. 10,000 volume
- Platform revenue: Kr. 2,000/day (20%) ↑ +33%
- Creator earnings: Kr. 8,000/day (80%) ↓ -6%

### Assumptions
- Tip volume remains constant (may decrease slightly due to higher fee)
- Users are willing to accept 20% platform fee (industry standard)
- Creator retention remains high (80% is still competitive)

## Future Considerations

1. **Tiered Fee Structure**: Lower fees for high-volume creators
   - <100 tips/month: 20%
   - 100-1000 tips/month: 18%
   - >1000 tips/month: 15%

2. **Premium Creators**: Verified creators could get reduced fees (15%)

3. **Promotional Periods**: Temporary fee reductions (10-15%) during launches

4. **Bundle Discounts**: Lower fees for users who also create contests

5. **Geographic Adjustments**: Different fees for different markets
   - Developed markets: 20%
   - Emerging markets: 15%
