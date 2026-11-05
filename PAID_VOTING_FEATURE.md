# Paid Voting Feature - Implementation Documentation

## Overview
This document describes the implementation of the paid voting cost feature in the contest creation wizard. Content creators can now set a custom amount that users must pay to vote, with real-time currency conversion between fiat and Rc.

## Feature Requirements
- Content creator toggles paid voting ON
- Content creator enters custom amount in their country's fiat currency
- Amount is converted in real-time to Rc using universal wallet conversion
- End users see Rc amount prominently with their location-based fiat currency conversion below/next to it
- Rc is always in focus for end users

## Implementation Details

### 1. Data Model Changes

#### CreateContestState (CreateContestViewModel.kt)
Added new field:
```kotlin
val votingCostFiat: Double = 0.0  // Amount in content creator's fiat currency
```

### 2. ViewModel Functions

#### Update Function
```kotlin
fun updateVotingCostFiat(v: Double)
```
- Updates the voting cost in fiat currency
- Called when content creator enters amount

#### Conversion Functions

**getVotingCostKrDisplay()**
- Converts fiat to Rc for content creator view
- Shows Rc equivalent of entered fiat amount
- Returns: `"Rc.500"` format

**getVotingCostUserDisplay()**
- Formats voting cost for end user preview
- Shows Rc prominently with fiat secondary
- Returns: `"Rc.500 (~KES 850)"` format
- Uses user's location-based currency code

### 3. Currency Conversion Logic

Uses existing wallet conversion system:
```kotlin
fun convertToKr(fiatAmount: Double, applyMargin: Boolean = true): Double
```
- Converts fiat to Rc using current exchange rate
- `applyMargin = false` for voting costs (no platform margin)
- Uses `currencyProvider.exchangeRate.value?.baseRate`

### 4. UI Components

#### VotingCostInput Composable (Step4PrizesAndValidation.kt)

**Input Field:**
- Label: "Amount per Vote"
- Leading icon: Currency code (e.g., "KES", "USD")
- Placeholder: "0.00"
- Keyboard type: Decimal
- Supporting text: "Amount users pay to vote (in your currency)"

**Real-time Conversion Display:**
- Green card showing Rc equivalent
- Two sections:
  1. **Rc Equivalent**: Shows converted Rc amount
  2. **Users will see**: Preview of end user display format

**Visual Design:**
- Dark theme with green accent (#34C759)
- Card background: #0A2912 (dark green)
- Rounded corners: 12dp
- Proper spacing and padding

### 5. Validation

Added validation in `validateStep4()`:
```kotlin
if (currentState.paidVoting && currentState.votingCostFiat <= 0.0) {
    errors["votingCost"] = "Voting cost must be greater than zero when paid voting is enabled"
}
```

### 6. User Flow

1. Content creator navigates to Step 4 (Prizes and Validation)
2. Scrolls to "Winner Selection Method" section
3. Toggles "Paid Voting" switch ON
4. Voting cost input field appears
5. Enters amount in their fiat currency (e.g., 100 KES)
6. Real-time conversion shows:
   - Rc Equivalent: Rc.500
   - Users will see: Rc.500 (~KES 100)
7. Validation ensures amount > 0 before proceeding

## Currency Display Format

### For Content Creator (Input View)
- Input: Fiat amount with currency code prefix
- Display: Rc equivalent in green card
- Example: Input "100" → Shows "Rc.500"

### For End Users (Preview)
- Primary: Rc amount (bold, prominent)
- Secondary: Fiat equivalent in parentheses
- Format: `Rc.{amount} (~{currency} {fiat})`
- Example: `Rc.500 (~KES 100)`

## Integration with Existing Features

### Mutual Exclusivity
- Entry fee and paid voting remain mutually exclusive
- Paid voting toggle disabled when entry fee > 0
- Validation error shown if both are enabled

### Currency Provider
- Uses `UserCurrencyProvider` for exchange rates
- Respects user's location-based currency
- Consistent with wallet conversion logic

### Wallet Conversion
- Uses same conversion functions as wallet
- No platform margin applied (applyMargin = false)
- Real-time rate updates

## Testing Checklist

### Content Creator Flow
- [ ] Toggle paid voting ON/OFF
- [ ] Enter voting cost in fiat currency
- [ ] Verify real-time Rc conversion displays
- [ ] Verify user preview shows correct format
- [ ] Test with different currency codes (KES, USD, EUR, etc.)
- [ ] Verify validation error when cost is 0 or negative
- [ ] Verify mutual exclusivity with entry fee

### End User Display
- [ ] Verify Rc amount is prominent
- [ ] Verify fiat equivalent shows user's currency
- [ ] Verify format: `Rc.{amount} (~{currency} {fiat})`
- [ ] Test with different user locations

### Edge Cases
- [ ] Exchange rate not loaded
- [ ] Zero or negative amounts
- [ ] Very large amounts
- [ ] Decimal precision
- [ ] Currency code display

## Files Modified

1. **CreateContestViewModel.kt**
   - Added `votingCostFiat` field to state
   - Added `updateVotingCostFiat()` function
   - Added `getVotingCostKrDisplay()` function
   - Added `getVotingCostUserDisplay()` function
   - Added validation for voting cost

2. **Step4PrizesAndValidation.kt**
   - Updated `PaidVotingToggle` to show input when enabled
   - Added `VotingCostInput` composable
   - Integrated real-time conversion display

## Future Enhancements

1. **Backend Integration**
   - Add `votingCostKr` field to contest creation API
   - Store voting cost in Rc (converted from fiat)
   - Validate voting cost on backend

2. **Voting Flow**
   - Implement vote payment processing
   - Show voting cost to users before voting
   - Handle insufficient balance scenarios

3. **Analytics**
   - Track voting revenue per contest
   - Show creator earnings from paid votes
   - Display voting statistics

## Notes

- Voting cost is stored in fiat but converted to Rc for display
- Backend should receive Rc amount (converted from fiat)
- Exchange rates are fetched from wallet currency provider
- No platform margin applied to voting costs
- Rc is always the primary display currency for end users
