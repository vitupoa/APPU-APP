# FRONTEND SAFE CONVERSION UPDATE GUIDE

## Quick Reference for Updating Remaining Files

### Import Statement to Add
```kotlin
import com.krieta.com.core.util.SafeConversion
```

### Conversion Patterns

#### Pattern 1: Simple Conversion
**Before:**
```kotlin
val amount = inputText.toDoubleOrNull() ?: 0.0
```

**After:**
```kotlin
val amount = SafeConversion.toDoubleOrDefault(
    value = inputText,
    fieldName = "amount",
    defaultValue = 0.0
)
```

#### Pattern 2: Conversion with Validation
**Before:**
```kotlin
val amount = inputText.toDoubleOrNull()
if (amount == null || amount < 0) {
    // handle error
}
```

**After:**
```kotlin
val amount = SafeConversion.toDoubleOrDefaultWithValidation(
    value = inputText,
    fieldName = "amount",
    min = 0.0,
    defaultValue = 0.0
)
```

#### Pattern 3: Nullable Conversion
**Before:**
```kotlin
val amount = inputText.toDoubleOrNull()
```

**After:**
```kotlin
val amount = if (inputText.isNotEmpty()) {
    SafeConversion.toDoubleOrDefault(
        value = inputText,
        fieldName = "amount",
        defaultValue = 0.0
    )
} else {
    null
}
```

---

## Files to Update

### 1. ChamaDashboardScreen.kt (4 occurrences)

**Location 1:**
```kotlin
// Line ~XXX
contributeAmount.toDoubleOrNull()?.let { ... }
```
**Replace with:**
```kotlin
val amount = SafeConversion.toDoubleOrDefaultWithValidation(
    value = contributeAmount,
    fieldName = "chamaContribution",
    min = 0.0,
    defaultValue = 0.0
)
if (amount > 0) { ... }
```

**Location 2:**
```kotlin
// Line ~XXX
enabled = contributeAmount.toDoubleOrNull() != null && !state.isContributing
```
**Replace with:**
```kotlin
enabled = contributeAmount.isNotEmpty() && 
    SafeConversion.toDoubleOrDefault(contributeAmount, "chamaContribution", 0.0) > 0 && 
    !state.isContributing
```

**Location 3 & 4:**
```kotlin
val collected = cycle.collectedAmountKr.toDoubleOrNull() ?: 0.0
val target = cycle.targetAmountKr.toDoubleOrNull() ?: 1.0
```
**Replace with:**
```kotlin
val collected = SafeConversion.toDoubleOrDefault(
    value = cycle.collectedAmountKr,
    fieldName = "collectedAmount",
    defaultValue = 0.0
)
val target = SafeConversion.toDoubleOrDefault(
    value = cycle.targetAmountKr,
    fieldName = "targetAmount",
    defaultValue = 1.0
)
```

---

### 2. CreateChamaViewModel.kt (3 occurrences)

**Location 1:**
```kotlin
1 -> s.contributionAmountKr.toDoubleOrNull() != null && s.contributionAmountKr.toDouble() > 0
```
**Replace with:**
```kotlin
1 -> {
    val amount = SafeConversion.toDoubleOrDefault(
        s.contributionAmountKr, 
        "contributionAmount", 
        0.0
    )
    amount > 0
}
```

**Location 2 & 3:**
```kotlin
membershipFeeKr = s.membershipFeeKr.toDoubleOrNull(),
penaltyAmountKr = s.penaltyAmountKr.toDoubleOrNull(),
```
**Replace with:**
```kotlin
membershipFeeKr = if (s.membershipFeeKr.isNotEmpty()) {
    SafeConversion.toDoubleOrDefault(s.membershipFeeKr, "membershipFee", 0.0)
} else null,
penaltyAmountKr = if (s.penaltyAmountKr.isNotEmpty()) {
    SafeConversion.toDoubleOrDefault(s.penaltyAmountKr, "penaltyAmount", 0.0)
} else null,
```

---

### 3. Step2AudienceAndFees.kt (1 occurrence)

**Location:**
```kotlin
onValueChange(it.toDoubleOrNull() ?: 0.0)
```
**Replace with:**
```kotlin
onValueChange(
    SafeConversion.toDoubleOrDefault(
        value = it,
        fieldName = "entryFee",
        defaultValue = 0.0
    )
)
```

---

### 4. Step4PrizesAndValidation.kt (2 occurrences)

**Both locations:**
```kotlin
val newAmount = it.toDoubleOrNull() ?: 0.0
```
**Replace with:**
```kotlin
val newAmount = SafeConversion.toDoubleOrDefaultWithValidation(
    value = it,
    fieldName = "prizeAmount",
    min = 0.0,
    defaultValue = 0.0
)
```

---

### 5. CampaignScreens.kt (1 occurrence)

**Location:**
```kotlin
title, description, budget.toDoubleOrNull() ?: 0.0,
```
**Replace with:**
```kotlin
title, 
description, 
SafeConversion.toDoubleOrDefaultWithValidation(
    value = budget,
    fieldName = "campaignBudget",
    min = 0.0,
    defaultValue = 0.0
),
```

---

### 6. SponsorAndGamificationScreens.kt (1 occurrence)

**Location:**
```kotlin
amount.toDoubleOrNull() ?: 0.0,
```
**Replace with:**
```kotlin
SafeConversion.toDoubleOrDefaultWithValidation(
    value = amount,
    fieldName = "sponsorAmount",
    min = 0.0,
    defaultValue = 0.0
),
```

---

### 7. SubscriptionTierSetupViewModel.kt (1 occurrence)

**Location:**
```kotlin
krAmount = it.krAmount.toDoubleOrNull() ?: 0.0,
```
**Replace with:**
```kotlin
krAmount = SafeConversion.toDoubleOrDefaultWithValidation(
    value = it.krAmount,
    fieldName = "subscriptionAmount",
    min = 0.0,
    defaultValue = 0.0
),
```

---

### 8. CreateListingViewModel.kt (1 occurrence)

**Location:**
```kotlin
val price = s.priceKr.toDoubleOrNull()
```
**Replace with:**
```kotlin
val price = if (s.priceKr.isNotEmpty()) {
    SafeConversion.toDoubleOrDefaultWithValidation(
        value = s.priceKr,
        fieldName = "productPrice",
        min = 0.0,
        defaultValue = 0.0
    )
} else null
```

---

### 9. CreateCampaignScreen.kt (2 occurrences)

**Both locations:**
```kotlin
budget = budget.toDoubleOrNull() ?: 0.0,
bidAmount = bidAmount.toDoubleOrNull() ?: 0.0,
```
**Replace with:**
```kotlin
budget = SafeConversion.toDoubleOrDefaultWithValidation(
    value = budget,
    fieldName = "campaignBudget",
    min = 0.0,
    defaultValue = 0.0
),
bidAmount = SafeConversion.toDoubleOrDefaultWithValidation(
    value = bidAmount,
    fieldName = "bidAmount",
    min = 0.0,
    defaultValue = 0.0
),
```

---

### 10. WithdrawScreen.kt (1 occurrence)

**Location:**
```kotlin
val amount = state.amount.toDoubleOrNull() ?: return false
```
**Replace with:**
```kotlin
val amount = SafeConversion.toDoubleOrDefaultWithValidation(
    value = state.amount,
    fieldName = "withdrawAmount",
    min = 0.0,
    defaultValue = 0.0
)
if (amount <= 0) return false
```

---

### 11. WithdrawViewModel.kt (1 occurrence - different file)

**Location:**
```kotlin
val amount = _state.value.amount.toDoubleOrNull()
```
**Replace with:**
```kotlin
val amount = if (_state.value.amount.isNotEmpty()) {
    SafeConversion.toDoubleOrDefaultWithValidation(
        value = _state.value.amount,
        fieldName = "withdrawAmount",
        min = 0.0,
        defaultValue = 0.0
    )
} else null
```

---

## Testing After Updates

### Test Cases for Each File

1. **Empty String Input**
   - Input: ""
   - Expected: Default value (0.0)
   - Verify: No crash, logs warning

2. **Invalid String Input**
   - Input: "abc", "12.34.56", "NaN"
   - Expected: Default value (0.0)
   - Verify: No crash, logs warning

3. **Negative Value (when min=0)**
   - Input: "-10"
   - Expected: 0.0 (minimum value)
   - Verify: Logs warning about below minimum

4. **Valid Value**
   - Input: "123.45"
   - Expected: 123.45
   - Verify: No warning logged

5. **Very Large Value**
   - Input: "999999999999"
   - Expected: Clamped to max (if specified)
   - Verify: Logs warning if exceeds max

### Verification Steps

1. Run the app in debug mode
2. Check console logs for conversion warnings
3. Test each input field with invalid values
4. Verify app doesn't crash
5. Verify default values are used correctly

---

## Batch Update Script (Optional)

If you want to automate some updates, you can use this pattern:

```bash
# Find all occurrences
grep -r "toDoubleOrNull()" composeApp/src/commonMain/kotlin/

# Count occurrences per file
grep -r "toDoubleOrNull()" composeApp/src/commonMain/kotlin/ | cut -d: -f1 | sort | uniq -c
```

---

## Completion Checklist

- [ ] ChamaDashboardScreen.kt (4 occurrences)
- [ ] CreateChamaViewModel.kt (3 occurrences)
- [ ] Step2AudienceAndFees.kt (1 occurrence)
- [ ] Step4PrizesAndValidation.kt (2 occurrences)
- [ ] CampaignScreens.kt (1 occurrence)
- [ ] SponsorAndGamificationScreens.kt (1 occurrence)
- [ ] SubscriptionTierSetupViewModel.kt (1 occurrence)
- [ ] CreateListingViewModel.kt (1 occurrence)
- [ ] CreateCampaignScreen.kt (2 occurrences)
- [ ] WithdrawScreen.kt (1 occurrence)
- [ ] WithdrawViewModel.kt (1 occurrence)

**Total: 19 occurrences across 11 files**

---

## After Completion

1. Build the app: `./gradlew :composeApp:assembleDebug`
2. Run tests: `./gradlew test`
3. Check logs for any conversion warnings
4. Update ERROR_HANDLING_LOGGING_ANALYTICS_SUMMARY.md
5. Mark task as complete ✅
