# Krieta Batch Fixes Plan

## Issues & Fixes

### 1. ✅ Currency Conversion Bug (KES 5 → Kr 617.22 is WRONG)
**Root Cause:** The backend returns `baseRate` as USD-to-KES rate (e.g., ~130). The mobile `fiatToKr` formula is:
```
baseKr = fiatAmount / (100.0 * rate)
```
With `rate = 130` (USD/KES) and `fiatAmount = 5` (KES):
```
baseKr = 5 / (100.0 * 130) = 5 / 13000 = 0.000384...
```
That gives ~0.0004 Kr, NOT 617.22. So the bug must be that `baseRate` is coming back as something like `0.0077` (the reciprocal, KES-to-USD rate) instead of 130. Let's verify:
```
5 / (100.0 * 0.0077) = 5 / 0.77 = 6.49 → with margin = 6.49 * 0.955 = ~6.2 Kr
```
Still not 617. But if `rate = 0.0077` and the formula accidentally used `fiatAmount / rate`:
```
5 / 0.0077 = 649 → * 0.955 = 620 Kr → Close to 617!
```

**Actual bug**: The `fiatToKr` formula divides by `100 * rate`. The `rate` from the API is `usd-to-fiat` (e.g., 130 for KES). But the formula treats it as the full Kr-to-fiat rate. Since 1 Kr = $100 USD = 13,000 KES, the correct conversion of KES 5 should be:
```
5 / 13000 = 0.000384 Kr
```
That's correct math but seems absurdly small. The real issue is: when the user enters KES 5 in the tipping modal, they expect it to show ~0.0004 Kr, which is below the minimum tip. The 617.22 result means the `baseRate` value being used is NOT the USD-to-KES rate (130), it's the raw `usd.json` rate which is the reciprocal (~0.0077).

**Wait** — re-examining `exchange.service.ts`: 
- `getRate()` fetches `usd.json` and returns `rates[kes]` which is 129.xx (USD→KES).
- But `getExchangeRate` endpoint returns `baseRate: rate` which is 129.xx
- Mobile `fiatToKr(5, 129.xx)` = `5 / (100 * 129.xx)` = `5 / 12900` = 0.000038 Kr. Way too small.

The formula is wrong. The user enters KES. 1 Kr = $100 = KES 12,950. So KES 5 = 5/12950 = 0.000386 Kr.

But the `KrAmountInput` passes `exchangeRate?.baseRate ?: 1.0` — if the rate fails to load and defaults to 1.0:
```
5 / (100 * 1.0) = 0.05 Kr
```
Still not 617. Let me check if `applyMargin` is causing issues... No, `applyMargin` reduces the value.

**NEW THEORY**: The `KrAmountInput` in TippingModal uses `applyMargin = true` (default). The `onAmountChanged` callback fires BEFORE `krAmount` is recomputed due to stale `derivedStateOf`. The fiat→Kr computation uses the `exchangeRate` from the state but there's a timing issue where the callback fires with the old krAmount.

**ACTUAL FIX**: The `onAmountChanged` in `KrAmountInput` fires inside `onValueChange` but `krAmount` is a derived state that hasn't been recalculated yet at that point. The `krAmount` passed to the callback is STALE. This is the real bug — the `onAmountChanged` fires with the previous `krAmount`.

### 2. ⬜ Contest Creation Crash (Adding Tasks)
**Root Cause:** The `Step3TasksAndConnectors` uses `LazyColumn` inside a parent `verticalScroll` (in `CreateContestScreen`). Nesting scrollable containers with the same direction causes a crash in Compose.
**Fix:** Replace `LazyColumn` with `Column` in `AddedTasksList` since the task list is small.

### 3. ⬜ Pause/Play Button for Shorts & Contests
**Fix:** Add a tap-to-toggle play/pause with a centered play/pause icon that auto-fades after 2 seconds.

### 4. ⬜ Shorts Feed Logic (Admire/Love/Unlove)
**Design Decision:** When user Unloves someone:
- The admire record for that direction is KEPT (they still admire the person)
- Only `isLovers` is set to false on the reverse record
- The user's shorts should STILL appear in the Admiring tab
**Current behavior already correct** — `unadmire` removes the record entirely, `unlove` just sets `isLovers=false`. But we don't have an `unlove` endpoint — only `unadmire`. Need to clarify the relationship model.

### 5. ⬜ Pause Shorts When Tip Modal Opens
**Fix:** Set `isPlaying = false` when `showTippingFor != null`.

### 6. ⬜ Top Up Button → Navigate to TopupScreen  
**Fix:** Wire `onInsufficientBalance` to push `TopupScreen`.

### 7. ⬜ Shorts Upload Crash
**Root Cause:** `FileStreamer.getFilePathOrUri` or `getFileSize` may be crashing on certain URIs.

### 8. ✅ Deprecated LocalLifecycleOwner (Already Fixed)
