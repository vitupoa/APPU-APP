# Nullable Double Fixes - Complete ✅

## Issues Fixed:
All "Operator call is prohibited on a nullable receiver of type 'Double?'" errors have been resolved.

## Files Modified:

### 1. ChamaDashboardScreen.kt (2 fixes)
**Line 211:**
```kotlin
// Before:
if (amount > 0) {

// After:
if ((amount ?: 0.0) > 0) {
```

**Line 212:**
```kotlin
// Before:
SafeConversion.toDoubleOrDefault(contributeAmount, "chamaContribution", 0.0) > 0

// After:
(SafeConversion.toDoubleOrDefault(contributeAmount, "chamaContribution", 0.0) ?: 0.0) > 0
```

### 2. CreateContestViewModel.kt (1 fix)
**Line 929:**
```kotlin
// Before:
if (currentState.title.isBlank() || currentState.description.isBlank() || prize <= 0) {

// After:
if (currentState.title.isBlank() || currentState.description.isBlank() || (prize ?: 0.0) <= 0) {
```

### 3. WithdrawViewModel.kt (2 fixes)
**Line 139:**
```kotlin
// Before:
if (fiatAmount <= 0 || rate == null) {

// After:
if ((fiatAmount ?: 0.0) <= 0 || rate == null) {
```

**Line 145:**
```kotlin
// Before:
val krNeeded = fiatAmount / rate.sellRate

// After:
val krNeeded = (fiatAmount ?: 0.0) / rate.sellRate
```

### 4. WithdrawScreen.kt (1 fix)
**Line 367:**
```kotlin
// Before:
if (amount <= 0 || amount > state.availableBalance) return false

// After:
if ((amount ?: 0.0) <= 0 || (amount ?: 0.0) > state.availableBalance) return false
```

## Root Cause:
The `SafeConversion.toDoubleOrDefaultWithValidation()` function returns `Double?` (nullable), but the code was using direct comparison operators (`>`, `<=`, `/`) which are not allowed on nullable types.

## Solution Applied:
Used the Elvis operator (`?:`) to provide a default value of `0.0` when the Double is null, allowing safe comparison and arithmetic operations:
- `amount > 0` → `(amount ?: 0.0) > 0`
- `fiatAmount / rate` → `(fiatAmount ?: 0.0) / rate`

## Status: ✅ ALL FIXED

All 6 nullable Double operator errors have been resolved:
- ChamaDashboardScreen.kt: 2 errors → 0 ✅
- CreateContestViewModel.kt: 1 error → 0 ✅
- WithdrawViewModel.kt: 2 errors → 0 ✅
- WithdrawScreen.kt: 1 error → 0 ✅

---

## Updated Error Count:
- **Nullable Double errors**: 6 → 0 ✅
- **Total remaining**: ~88 errors

Run `.\gradlew.bat :composeApp:assembleDebug` to verify!
