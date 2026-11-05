# Top-Up Fee Calculation Examples

## Fee Structure

- **Flat Fee:** KES 30
- **Platform Margin:** 4.5%
- **Total Fees:** KES 30 + 4.5% of remaining amount

---

## Calculation Formula

```
Step 1: Deduct flat fee
Amount after flat fee = Input Amount - 30

Step 2: Apply platform margin
Amount after margin = Amount after flat fee × (1 - 0.045)
Amount after margin = Amount after flat fee × 0.955

Step 3: Convert to Rc
Rc Amount = (Amount after margin ÷ Exchange Rate) × 100
```

---

## Example Calculations (Assuming 1 USD = 130 KES)

### Example 1: KES 100
```
Input: KES 100
Step 1: 100 - 30 = KES 70
Step 2: 70 × 0.955 = KES 66.85
Step 3: 66.85 ÷ 130 = 0.5142 USD = 51.42 Rc
Result: ~51 Rc

Total Fees: KES 33.15 (33.15%)
```

### Example 2: KES 500
```
Input: KES 500
Step 1: 500 - 30 = KES 470
Step 2: 470 × 0.955 = KES 448.85
Step 3: 448.85 ÷ 130 = 3.4527 USD = 345.27 Rc
Result: ~345 Rc

Total Fees: KES 51.15 (10.23%)
```

### Example 3: KES 1,000
```
Input: KES 1,000
Step 1: 1000 - 30 = KES 970
Step 2: 970 × 0.955 = KES 926.35
Step 3: 926.35 ÷ 130 = 7.1258 USD = 712.58 Rc
Result: ~712 Rc

Total Fees: KES 73.65 (7.37%)
```

### Example 4: KES 5,000
```
Input: KES 5,000
Step 1: 5000 - 30 = KES 4,970
Step 2: 4970 × 0.955 = KES 4,746.35
Step 3: 4746.35 ÷ 130 = 36.5104 USD = 3,651.04 Rc
Result: ~3,651 Rc

Total Fees: KES 253.65 (5.07%)
```

### Example 5: KES 10,000
```
Input: KES 10,000
Step 1: 10000 - 30 = KES 9,970
Step 2: 9970 × 0.955 = KES 9,521.35
Step 3: 9521.35 ÷ 130 = 73.2412 USD = 7,324.12 Rc
Result: ~7,324 Rc

Total Fees: KES 478.65 (4.79%)
```

---

## Fee Percentage by Amount

| Input Amount | Flat Fee | Margin Fee | Total Fees | Fee % |
|--------------|----------|------------|------------|-------|
| KES 100      | KES 30   | KES 3.15   | KES 33.15  | 33.15% |
| KES 200      | KES 30   | KES 7.65   | KES 37.65  | 18.83% |
| KES 500      | KES 30   | KES 21.15  | KES 51.15  | 10.23% |
| KES 1,000    | KES 30   | KES 43.65  | KES 73.65  | 7.37%  |
| KES 2,000    | KES 30   | KES 88.65  | KES 118.65 | 5.93%  |
| KES 5,000    | KES 30   | KES 223.65 | KES 253.65 | 5.07%  |
| KES 10,000   | KES 30   | KES 448.65 | KES 478.65 | 4.79%  |

---

## Key Insights

1. **Flat fee impact decreases with larger amounts**
   - At KES 100: Flat fee is 30% of total
   - At KES 10,000: Flat fee is only 0.3% of total

2. **Effective fee rate approaches 4.5% for large amounts**
   - Small amounts: ~33% total fees
   - Large amounts: ~4.8% total fees (approaching 4.5% margin)

3. **Minimum recommended top-up: KES 100**
   - Below KES 100, fees become very high percentage
   - At KES 50: Would result in only ~19 Rc after fees

4. **Sweet spot: KES 1,000 - KES 10,000**
   - Reasonable fee percentage (4.8% - 7.4%)
   - Good Rc amount received
   - Not too large to risk

---

## User-Facing Fee Display

In the app, users see:
```
You will receive: XXX Rc
Fees: 4.5% + KES 30
```

This is transparent and clear about the fee structure.

---

## Backend Implementation

```typescript
// Deduct KES 30 flat fee first
const fiatAfterFlatFee = Math.max(0, fiatAmount - 30);

// Apply 4.5% margin
const platformMargin = 0.045;
const fiatAfterMargin = fiatAfterFlatFee * (1 - platformMargin);

// Convert to USD base
const baseUsd = fiatAfterMargin / buyRate;

// Convert to Rc (1 Rc = $0.01 USD)
const krAmount = Math.floor(baseUsd * 100);
```

---

## Frontend Implementation

```kotlin
// Apply 4.5% platform margin + KES 30 flat fee
val fiatAfterFlatFee = kotlin.math.max(0.0, fiatAmount - 30.0)
val platformMargin = 0.045
val fiatAfterMargin = fiatAfterFlatFee * (1 - platformMargin)

// User pays buyRate for top-up (they buy Rc)
val krAmount = fiatAfterMargin / rate.buyRate
```

---

## Testing Scenarios

### Test 1: Minimum Amount
- Input: KES 100
- Expected: ~51 Rc
- Fee: ~33%

### Test 2: Standard Amount
- Input: KES 1,000
- Expected: ~712 Rc
- Fee: ~7.4%

### Test 3: Large Amount
- Input: KES 10,000
- Expected: ~7,324 Rc
- Fee: ~4.8%

### Test 4: Edge Case (Below Minimum)
- Input: KES 50
- Expected: ~19 Rc
- Fee: ~62%
- Note: Should warn user about high fees

---

## Recommendations

1. **Set minimum top-up amount:** KES 100
2. **Recommend optimal range:** KES 1,000 - KES 10,000
3. **Show fee breakdown** before user confirms
4. **Display effective fee percentage** for transparency

---

## Status: ✅ IMPLEMENTED

All fee calculations are now implemented in both backend and frontend with real-time preview.
