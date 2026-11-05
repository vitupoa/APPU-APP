# Universal Content Locking System - Implementation Guide

## Overview
This system allows creators to lock their Shorts, Drips (Posts), and Live streams, requiring users to either:
1. Subscribe to the creator (if `requiredTier` is set)
2. Unlock the individual content by paying a one-time fee

## Database Changes

### Migration Applied
Run the migration file: `prisma/migrations/add_content_unlock_system.sql`

This adds:
- `unlock_amount_kr` column to `shorts`, `posts`, and `live_streams` tables
- `content_unlocks` table to track individual content unlocks

### Schema Updates Needed
Add to `schema.prisma`:

```prisma
model Short {
  // ... existing fields
  unlockAmountRc Decimal? @map("unlock_amount_kr") @db.Decimal(18, 4)
}

model Post {
  // ... existing fields
  unlockAmountRc Decimal? @map("unlock_amount_kr") @db.Decimal(18, 4)
}

model LiveStream {
  // ... existing fields
  unlockAmountRc Decimal? @map("unlock_amount_kr") @db.Decimal(18, 4)
}
```

## Backend Implementation

### 1. Content Lock Service
Location: `src/modules/contentLock/contentLock.service.ts`

Key methods:
- `checkAccess()` - Check if user has access to locked content
- `unlockContent()` - Unlock content by paying Rc
- `getUnlockPrice()` - Get price in user's currency with real-time conversion
- `convertFiatToKr()` - Convert creator's fiat input to Rc

### 2. API Endpoints
Location: `src/modules/contentLock/contentLock.routes.ts`

```
POST /api/content-lock/unlock
GET  /api/content-lock/price
POST /api/content-lock/convert-fiat
GET  /api/content-lock/check-access
```

### 3. Integration with Existing Services

#### Shorts Service
- Updated `getFeed()` to check access for locked content
- Updated `createShort()` to accept `unlockAmountKr` parameter
- Locked content returns `null` for `videoUrl` and empty `mediaUrls` if user doesn't have access

#### Feed Service (Drips/Posts)
- Updated `getFeed()` to check access for locked content
- Updated `createPost()` to accept `unlockAmountKr` parameter
- Locked content returns empty `imageUrls` if user doesn't have access

#### Live Service
- Updated `startStream()` to accept `unlockAmountKr` parameter
- Updated `joinStream()` to check access before allowing user to join
- Throws error if user tries to join locked stream without access

### 4. Register Routes
Add to your main routes file (e.g., `src/index.ts`):

```typescript
import contentLockRoutes from './modules/contentLock/contentLock.routes.js';

app.use('/api/content-lock', contentLockRoutes);
```

## Currency Conversion Flow

### Creator Sets Lock Amount (Fiat → Rc)
1. Creator enters amount in their local currency (e.g., 500 KES)
2. Frontend calls `POST /api/content-lock/convert-fiat` with `{ fiatAmount: 500, currency: 'KES' }`
3. Backend converts to Rc using real-time exchange rate
4. Returns Rc amount to display to creator
5. Creator creates content with `unlockAmountKr` field

### User Views Lock Price (Rc → Fiat)
1. User sees locked content with `unlockAmountKr` (e.g., 50 Rc)
2. Frontend calls `GET /api/content-lock/price?unlockAmountKr=50&currency=USD`
3. Backend converts Rc to user's local currency using real-time exchange rate
4. Returns: `{ krAmount: 50, fiatAmount: 50, currency: 'USD', displayText: '50 Rc (≈ 50 USD)' }`
5. Display with Rc in focus and fiat as secondary

## Frontend Implementation

### 1. Create Content (Shorts/Drips/Live)

```typescript
// Creator UI
const [lockAmount, setLockAmount] = useState('');
const [lockAmountKr, setLockAmountKr] = useState(0);
const [isLocked, setIsLocked] = useState(false);

// Real-time conversion as creator types
const handleLockAmountChange = async (fiatAmount: string) => {
  setLockAmount(fiatAmount);
  
  if (fiatAmount && Number(fiatAmount) > 0) {
    const response = await fetch('/api/content-lock/convert-fiat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fiatAmount: Number(fiatAmount),
        currency: userCurrency // e.g., 'KES'
      })
    });
    
    const data = await response.json();
    setLockAmountKr(data.krAmount);
  }
};

// Create content
const createShort = async () => {
  await fetch('/api/shorts', {
    method: 'POST',
    body: JSON.stringify({
      videoUrl,
      caption,
      isLocked,
      unlockAmountKr: isLocked ? lockAmountRc : undefined,
      requiredTier: selectedTier // Optional: for subscription-based access
    })
  });
};
```

### 2. Display Locked Content

```typescript
// Shorts/Drips Feed
interface ContentItem {
  id: string;
  isLocked: boolean;
  unlockAmountKr?: number;
  hasAccess: boolean;
  requiresSubscription?: boolean;
  requiresUnlock?: boolean;
  videoUrl: string | null; // null if locked and no access
  imageUrls: string[]; // empty if locked and no access
}

// Display logic
const ShortItem = ({ short }: { short: ContentItem }) => {
  const [unlockPrice, setUnlockPrice] = useState<any>(null);
  
  useEffect(() => {
    if (short.isLocked && !short.hasAccess && short.unlockAmountKr) {
      fetchUnlockPrice();
    }
  }, [short]);
  
  const fetchUnlockPrice = async () => {
    const response = await fetch(
      `/api/content-lock/price?unlockAmountKr=${short.unlockAmountKr}&currency=${userCurrency}`
    );
    const data = await response.json();
    setUnlockPrice(data);
  };
  
  const handleUnlock = async () => {
    const response = await fetch('/api/content-lock/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId: short.id,
        contentType: 'SHORT'
      })
    });
    
    if (response.ok) {
      // Refresh content to show unlocked version
      refreshFeed();
    }
  };
  
  if (short.isLocked && !short.hasAccess) {
    return (
      <div className="locked-content">
        <LockIcon />
        <p>This content is locked</p>
        
        {short.requiresSubscription && (
          <button onClick={handleSubscribe}>
            Subscribe to unlock
          </button>
        )}
        
        {short.requiresUnlock && unlockPrice && (
          <button onClick={handleUnlock}>
            Unlock for {unlockPrice.krAmount} Rc
            <span className="fiat-price">
              (≈ {unlockPrice.fiatAmount} {unlockPrice.currency})
            </span>
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="short-item">
      <video src={short.videoUrl} />
      {/* ... rest of content */}
    </div>
  );
};
```

### 3. Live Stream Access

```typescript
const joinLiveStream = async (streamId: string) => {
  try {
    const response = await fetch(`/api/live/${streamId}/join`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      if (error.message.includes('unlock')) {
        // Show unlock modal
        showUnlockModal(streamId);
      }
    }
  } catch (error) {
    console.error('Failed to join stream:', error);
  }
};

const showUnlockModal = async (streamId: string) => {
  // Fetch stream details to get unlock amount
  const stream = await fetch(`/api/live/${streamId}`).then(r => r.json());
  
  // Fetch price in user's currency
  const price = await fetch(
    `/api/content-lock/price?unlockAmountKr=${stream.unlockAmountKr}&currency=${userCurrency}`
  ).then(r => r.json());
  
  // Show modal with unlock button
  Modal.show({
    title: 'Unlock Live Stream',
    content: `Unlock for ${price.displayText}`,
    onConfirm: async () => {
      await fetch('/api/content-lock/unlock', {
        method: 'POST',
        body: JSON.stringify({
          contentId: streamId,
          contentType: 'LIVE'
        })
      });
      
      // Retry joining
      joinLiveStream(streamId);
    }
  });
};
```

## UI/UX Guidelines

### Display Format
Always show Rc amount in focus with fiat as secondary:
- ✅ **50 Rc** (≈ 500 KES)
- ❌ 500 KES (50 Rc)

### Creator Input
1. Creator enters amount in their local currency
2. Show real-time Rc conversion as they type
3. Display both values when creating content

### User View
1. Show Rc amount prominently
2. Show user's local currency equivalent below/beside
3. Update conversion in real-time when user changes currency preference

## Access Control Logic

```
User can access locked content if:
1. User is the creator (always has access)
2. User is subscribed to creator (if requiredTier is set)
3. User has unlocked the content individually

Otherwise:
- Show locked state
- Offer subscription option (if requiredTier is set)
- Offer unlock option (if unlockAmountRc is set)
```

## Payment Flow

1. User clicks "Unlock" button
2. System checks user's Rc balance
3. If sufficient:
   - Deduct Rc from user wallet
   - Credit creator (85% after 15% platform fee)
   - Record unlock in `content_unlocks` table
   - Record transactions for audit trail
4. If insufficient:
   - Show "Insufficient balance" error
   - Offer top-up option

## Testing Checklist

### Backend
- [ ] Run migration successfully
- [ ] Test content creation with unlock amount
- [ ] Test access check for locked content
- [ ] Test unlock payment flow
- [ ] Test currency conversion (fiat → Rc)
- [ ] Test price display (Rc → fiat)
- [ ] Test subscription-based access
- [ ] Test creator always has access to own content

### Frontend
- [ ] Creator can set lock amount in their currency
- [ ] Real-time Rc conversion works
- [ ] Locked content shows lock icon/overlay
- [ ] Unlock button displays correct price
- [ ] Rc shown in focus, fiat as secondary
- [ ] Unlock payment flow works
- [ ] Content refreshes after unlock
- [ ] Subscription option shown when applicable

## Notes

### Subscription vs Individual Unlock
- If `requiredTier` is set: User must subscribe to access
- If `unlockAmountKr` is set: User can unlock individually
- Both can be set: User can choose either option
- Neither set: Content is free (not locked)

### Platform Fee
- 15% platform fee applied to all unlock payments
- Same as tipping system
- Recorded in transactions table

### Currency Conversion
- Uses existing `ExchangeService` from wallet module
- Real-time rates from external API
- Cached for 5 minutes
- Fallback to stale cache if API fails

### Security
- Atomic transactions with database locks
- Prevents double-spending
- Prevents duplicate unlocks
- Validates user balance before unlock
- Records all transactions for audit trail
