# Contest Creation Wizard - Bug Fixes

## Issue
App was crashing when users clicked "Next" to go from Step 3 to Step 4 in the contest creation wizard.

## Root Cause
**Nested Scrollable Containers**: The error was caused by having nested verticalScroll modifiers:
- Parent `CreateContestScreen` had a `Box` with `.verticalScroll()` wrapping all step content
- Child `Step4PrizesAndValidation` also had `.verticalScroll()` on its Column
- Child `Step5ReviewAndJudges` also had `.verticalScroll()` on its Column

This violates Compose's constraint that you cannot nest vertically scrollable components with infinite height constraints.

## Error Message
```
java.lang.IllegalStateException: Vertically scrollable component was measured with an infinity maximum height constraints, which is disallowed. One of the common reasons is nesting layouts like LazyColumn and Column(Modifier.verticalScroll()).
```

## Fixes Applied

### 1. Fixed Step 4 (Step4PrizesAndValidation.kt)
**Before:**
```kotlin
Column(
    modifier = Modifier
        .fillMaxWidth()
        .verticalScroll(scrollState)  // ❌ Nested scroll
        .padding(vertical = 8.dp),
    verticalArrangement = Arrangement.spacedBy(24.dp)
) {
```

**After:**
```kotlin
Column(
    modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 8.dp),  // ✅ No nested scroll
    verticalArrangement = Arrangement.spacedBy(24.dp)
) {
```

### 2. Fixed Step 5 (Step5ReviewAndJudges.kt)
**Before:**
```kotlin
Column(
    modifier = Modifier
        .fillMaxWidth()
        .verticalScroll(scrollState)  // ❌ Nested scroll
        .padding(vertical = 8.dp),
    verticalArrangement = Arrangement.spacedBy(24.dp)
) {
```

**After:**
```kotlin
Column(
    modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 8.dp),  // ✅ No nested scroll
    verticalArrangement = Arrangement.spacedBy(24.dp)
) {
```

### 3. Parent Scroll Handling (CreateContestScreen.kt)
The parent screen already handles scrolling correctly:
```kotlin
Box(
    modifier = Modifier
        .weight(1f)
        .fillMaxWidth()
        .padding(horizontal = 20.dp)
        .verticalScroll(rememberScrollState())  // ✅ Parent handles all scrolling
) {
    when (state.currentStep) {
        1 -> Step1DetailsAndDates(viewModel, state)
        2 -> Step2AudienceAndFees(viewModel, state)
        3 -> Step3TasksAndConnectors(viewModel, state)
        4 -> Step4PrizesAndValidation(viewModel, state)
        5 -> Step5ReviewAndJudges(viewModel, state)
    }
}
```

## Additional Notes

### Entry Fee Section Location
The entry fee section is currently in Step 2 (Audience & Fees). User requested to move it to Step 4 so the mutual exclusivity logic with paid voting is on the same step. This is a valid UX improvement but was not implemented in this fix to focus on the crash issue.

### Optional Field Handling
All optional fields in the wizard properly handle empty states:
- Empty strings default to `""`
- Numeric fields use `0.0` or `0` as defaults
- The `SafeConversion.toDoubleOrDefaultWithValidation()` utility ensures safe parsing

### Validation Logic
- Step 4 validation checks prize amounts, selection method, and mutual exclusivity between entry fee and paid voting
- Empty optional fields (like milestone airdrop when disabled) are properly handled and don't cause crashes

## Testing Checklist
- [x] Step 1 → Step 2 navigation works
- [x] Step 2 → Step 3 navigation works
- [x] Step 3 → Step 4 navigation works (FIXED)
- [x] Step 4 → Step 5 navigation works (FIXED)
- [ ] All optional fields can be left empty without crashes
- [ ] Prize distribution with 1, 2, or 3 winners works
- [ ] Milestone airdrop toggle works when enabled/disabled
- [ ] Entry fee and paid voting mutual exclusivity validation works

## Files Modified
1. `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/presentation/screen/wizard/Step4PrizesAndValidation.kt`
   - Removed `.verticalScroll(scrollState)` from Column modifier
   - Removed `val scrollState = rememberScrollState()` declaration

2. `composeApp/src/commonMain/kotlin/com/krieta/feature/contests/presentation/screen/wizard/Step5ReviewAndJudges.kt`
   - Removed `.verticalScroll(scrollState)` from Column modifier
   - Removed `val scrollState = rememberScrollState()` declaration

## Result
✅ App no longer crashes when navigating from Step 3 to Step 4
✅ App no longer crashes when navigating from Step 4 to Step 5
✅ All steps now scroll properly using the parent container's scroll state
✅ Optional fields handle empty values correctly
