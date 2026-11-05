# Entry Fee Section Relocation - Implementation Summary

## Overview
Moved the entry fee configuration section from Step 2 (Audience and Fees) to Step 4 (Prizes and Validation) for better user experience and logical grouping with the paid voting feature.

## Changes Made

### 1. Step 2 (Step2AudienceAndFees.kt)
**Removed:**
- `EntryFeeSection` composable
- `EntryFeeInputField` composable
- `KrConversionDisplay` composable
- Entry fee section from main Step2 layout

**Updated:**
- File documentation to reflect removal of entry fee (Requirements: 3.1-4.8)
- Main composable now only contains:
  - Audience Demographics Section
  - Team Participation Section

### 2. Step 4 (Step4PrizesAndValidation.kt)
**Added:**
- `EntryFeeSection` composable (moved from Step 2)
- `EntryFeeInputField` composable (moved from Step 2)
- `KrConversionDisplay` composable (moved from Step 2)
- Entry fee section as first section in Step 4 layout

**Updated:**
- Paid voting toggle warning message
- Shows context-aware message based on entry fee state

### 3. Paid Voting Warning Message
**Before:**
```
"Users pay Rc to vote for submissions"
```

**After (Dynamic):**
- When entry fee = 0: `"Users pay Rc to vote for submissions"`
- When entry fee > 0: `"Participants can't pay to vote when they are paying to participate"`

## New Step 4 Layout Order

1. **Entry Fee Section** (NEW POSITION)
   - Entry fee input field
   - Real-time Rc conversion display

2. **Prize Distribution Section**
   - Winner slots selector
   - Prize amount inputs
   - Total prize pool display

3. **Selection Method Section**
   - Selection method dropdown
   - Paid voting toggle with dynamic warning
   - Voting cost input (when paid voting enabled)

4. **Milestone Airdrop Section**
   - Airdrop toggle
   - Airdrop configuration fields

## Benefits of This Change

### 1. Better UX
- Entry fee and paid voting are now in the same step
- Users can immediately see the mutual exclusivity relationship
- No need to navigate back to Step 2 to adjust entry fee

### 2. Logical Grouping
- All monetization features are now in Step 4:
  - Entry fee (participants pay to enter)
  - Paid voting (users pay to vote)
  - Prize distribution (winners receive prizes)
  - Milestone airdrop (early participants get rewards)

### 3. Clearer Context
- Dynamic warning message explains why paid voting is disabled
- Users understand the relationship between entry fee and paid voting
- Better error prevention

### 4. Improved Flow
- Step 2 is now focused on audience targeting:
  - Demographics restrictions
  - Team participation configuration
- Step 4 is now focused on contest economics:
  - Entry fees
  - Prizes
  - Voting costs
  - Airdrops

## Validation Logic (Unchanged)

The mutual exclusivity validation remains the same:
```kotlin
if (currentState.entryFee > 0.0 && currentState.paidVoting) {
    errors["mutualExclusivity"] = "Entry fee and paid voting are mutually exclusive"
}
```

## UI Behavior

### Entry Fee Input
- Label: "Participation Fee"
- Currency code prefix (e.g., KES, USD)
- Placeholder: "0.00"
- Supporting text: "Leave at 0 for free contests"
- Real-time Rc conversion display when amount > 0

### Paid Voting Toggle
- **Enabled state**: Entry fee = 0
  - Description: "Users pay Rc to vote for submissions"
  - Can be toggled ON/OFF
  
- **Disabled state**: Entry fee > 0
  - Description: "Participants can't pay to vote when they are paying to participate"
  - Toggle is disabled (grayed out)
  - Cannot be turned ON

### Voting Cost Input
- Only appears when paid voting is ON
- Shows real-time Rc conversion
- Shows end user preview format

## Testing Checklist

### Entry Fee in Step 4
- [ ] Entry fee section appears at top of Step 4
- [ ] Entry fee input accepts decimal values
- [ ] Real-time Rc conversion displays correctly
- [ ] Validation works (negative values rejected)
- [ ] Currency code displays user's location currency

### Paid Voting Interaction
- [ ] Paid voting toggle disabled when entry fee > 0
- [ ] Warning message changes based on entry fee state
- [ ] Paid voting toggle enabled when entry fee = 0
- [ ] Voting cost input appears when paid voting ON
- [ ] Mutual exclusivity validation works

### Navigation
- [ ] Step 2 validation works without entry fee
- [ ] Step 4 validation includes entry fee
- [ ] Can navigate back to Step 2 from Step 4
- [ ] Can navigate forward from Step 4 to Step 5

### Edge Cases
- [ ] Setting entry fee > 0 disables paid voting
- [ ] Enabling paid voting prevents entry fee input
- [ ] Clearing entry fee (set to 0) enables paid voting toggle
- [ ] Validation errors display correctly

## Files Modified

1. **Step2AudienceAndFees.kt**
   - Removed entry fee section and related composables
   - Updated documentation

2. **Step4PrizesAndValidation.kt**
   - Added entry fee section at top
   - Updated paid voting warning message
   - Added entry fee composables

## Migration Notes

- No database changes required
- No API changes required
- No state model changes required
- Entry fee field remains in same state location
- Only UI layout changed

## Future Considerations

1. **Backend Integration**
   - Ensure API accepts entry fee in Step 4 context
   - Validate mutual exclusivity on backend

2. **Analytics**
   - Track how often users set entry fees
   - Track paid voting vs entry fee usage
   - Monitor mutual exclusivity conflicts

3. **User Feedback**
   - Monitor user confusion around mutual exclusivity
   - Gather feedback on new layout
   - Consider adding tooltips or help text
