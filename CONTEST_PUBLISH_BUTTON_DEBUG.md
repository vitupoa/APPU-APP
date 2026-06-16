# Contest Publish Button Not Working - Debugging Guide

## Problem
When clicking the "Publish Contest" button on Step 5 of the contest creation wizard, nothing happens.

## Possible Causes

### 1. Button is Disabled
The publish button is disabled when:
```kotlin
enabled = isValid && !isSubmitting
```

**Check if**:
- `isValid` is false (validation failing)
- `isSubmitting` is true (already in progress)

### 2. Validation Failing
The button calls `viewModel.isCurrentStepValid()` which checks Step 5 validation:

```kotlin
private fun validateStep5(): Boolean {
    val judgesValid = when (selectionMethod) {
        SelectionMethod.MANUAL, SelectionMethod.COMBINATION -> 
            judges.isNotEmpty() && judges.size <= 15
        SelectionMethod.RANDOM, SelectionMethod.VOTING -> true
    }
    return judgesValid
}
```

**Issue**: If selection method is MANUAL or COMBINATION but no judges assigned, button is disabled.

### 3. Wallet Balance Check
Before publishing, the code checks:
```kotlin
if (currentState.walletBalance < totalCostKr) {
    // Show insufficient balance error
    return
}
```

**Issue**: If wallet balance is 0 or less than prize pool, it won't proceed.

### 4. Silent Failure
The `publishContest()` function might fail silently without showing errors.

## Debugging Steps Added

### 1. Button Click Logging
Added logging when publish button is clicked:
```kotlin
onClick = {
    println("🔘 Publish button clicked")
    println("   Is valid: $isValid")
    println("   Is submitting: $isSubmitting")
    onPublish()
}
```

**What to check**: Look for this log in the console. If you don't see it, button is disabled.

### 2. PublishContest Function Logging
Added comprehensive logging in `publishContest()`:
```kotlin
println("🎯 Starting publishContest")
println("   Current step: ${currentState.currentStep}")
println("   Validate all steps: ${validateAllSteps()}")
println("   Total prize (fiat): $totalPrize")
println("   Total cost (Kr): $totalCostKr")
println("   Wallet balance (Kr): ${currentState.walletBalance}")
```

**What to check**: 
- Is the function being called?
- Which validation is failing?
- Is wallet balance sufficient?

## How to Test

### Test 1: Check Button State
1. Open contest creation wizard
2. Complete steps 1-4
3. Navigate to Step 5
4. Check the console for logs
5. Verify button is enabled (yellow color, not gray)

**Expected**:
- Button should be yellow (#F5A623)
- Button should not show gray (#3A3A3F)
- Click should trigger log: "🔘 Publish button clicked"

### Test 2: Check Validation
1. Complete all steps properly
2. On Step 5, check if validation passes
3. Look for console log: "✅ All validations passed"

**Common Issues**:
- Step 1: Missing title, description, or dates
- Step 2: Invalid team configuration
- Step 3: No tasks added
- Step 4: Invalid prize amounts (must be > 0)
- Step 5: If using MANUAL/COMBINATION selection, need judges

### Test 3: Check Wallet Balance
1. Check your wallet balance before creating contest
2. Ensure balance >= prize pool in Kr
3. Look for log showing balance comparison

**Example**:
```
Total prize (fiat): 1000.0 KES
Total cost (Kr): 769.23
Wallet balance (Kr): 100.0
❌ Insufficient Kr balance...
```

### Test 4: Check Network Request
1. Click publish button
2. Check network tab in developer tools
3. Look for POST request to `/api/v1/contests`

**Expected Response**:
```json
{
  "contest_id": "uuid-here",
  "message": "Contest created successfully"
}
```

**Error Response**:
```json
{
  "error": "Error message here"
}
```

## Common Solutions

### Solution 1: Validation Failing
If Step 5 validation is failing because no judges assigned:

**Option A**: Add judges
1. Search for users in the judge search field
2. Click "+" button to add them
3. Minimum 1 judge required for MANUAL/COMBINATION selection

**Option B**: Change selection method
1. Go back to Step 4
2. Change selection method to VOTING or RANDOM
3. These don't require judges
4. Return to Step 5

### Solution 2: Insufficient Balance
If wallet balance is too low:

1. Click "Top Up Wallet" button in error card
2. Add funds to wallet
3. Return to contest creation
4. Try publishing again

**Calculate Required Balance**:
```
Prize Pool (fiat) ÷ Exchange Rate = Kr Needed
Example: 1000 KES ÷ 130 = 769.23 Kr

Plus 15% platform fee:
769.23 × 1.15 = 884.61 Kr total needed
```

### Solution 3: Step Validation Issues
If any step validation is failing:

1. Check console for "❌ Validation failed" message
2. Go back to the indicated step
3. Fix the validation errors
4. Return to Step 5

**Common Fixes**:
- Step 1: Ensure dates are at least 2 hours apart
- Step 2: Team size must be 2-10 if team participation enabled
- Step 3: Add at least one task
- Step 4: All prize amounts must be > 0
- Step 5: Add judges if using MANUAL/COMBINATION

### Solution 4: Frontend-Backend Mismatch
If the button clicks but nothing happens:

1. Check browser console for JavaScript errors
2. Check network tab for failed API requests
3. Verify backend is running
4. Check if there's a CORS or authentication error

## Console Logs to Watch For

### Successful Flow
```
🔘 Publish button clicked
   Is valid: true
   Is submitting: false
🎯 Starting publishContest
   Current step: 5
   Validate all steps: true
   Total prize (fiat): 1000.0
   Total cost (Kr): 769.23
   Wallet balance (Kr): 1000.0
✅ All validations passed, starting contest creation
🚀 Launching contest creation coroutine
```

### Failed Flow - Validation
```
🔘 Publish button clicked
   Is valid: false
   Is submitting: false
(Function doesn't run because button is disabled)
```

### Failed Flow - Insufficient Balance
```
🔘 Publish button clicked
   Is valid: true
   Is submitting: false
🎯 Starting publishContest
   Current step: 5
   Validate all steps: true
   Total prize (fiat): 1000.0
   Total cost (Kr): 769.23
   Wallet balance (Kr): 100.0
❌ Insufficient Kr balance. You need Kr. 769.23 but only have Kr. 100.0
```

### Failed Flow - Backend Error
```
🎯 Starting publishContest
✅ All validations passed
🚀 Launching contest creation coroutine
Network Error: Connection refused
(Error should display in UI error card)
```

## Visual Indicators

### Button States

**Enabled State**:
- Background: Yellow (#F5A623)
- Text: Black
- Text: "Publish Contest"
- Clickable: Yes

**Disabled State**:
- Background: Gray (#3A3A3F)
- Text: Gray (#808080)
- Text: "Publish Contest"
- Clickable: No

**Loading State**:
- Background: Yellow (#F5A623)
- Shows spinner + "Publishing..."
- Clickable: No

## Files to Check

### Frontend
- `CreateContestScreen.kt` - Publish button UI
- `CreateContestViewModel.kt` - Publishing logic
- `ContestsRepositoryImpl.kt` - API call
- `ContestsApi.kt` - HTTP request

### Backend
- `contests.routes.ts` - POST /api/v1/contests endpoint
- `contests.service.ts` - createContest method
- `wallet.service.ts` - Balance deduction

## Next Steps

1. **Run the app** with these debug logs
2. **Navigate to Step 5** of contest creation
3. **Check the console** for log messages
4. **Identify which validation** is failing
5. **Fix the issue** based on the logs
6. **Try publishing again**

## Report Issues

When reporting this issue, include:
1. Complete console logs
2. Which step validation is failing
3. Current wallet balance
4. Prize pool amount
5. Selection method chosen
6. Number of judges (if applicable)
7. Network requests (from browser dev tools)
8. Any error messages displayed

## Rollback

If debug logs are too verbose for production, remove these lines:
- Button click logging in `CreateContestScreen.kt`
- Function logging in `CreateContestViewModel.publishContest()`

But keep them during debugging to diagnose the issue.
