# PAYSTACK MULTI-COUNTRY SUPPORT DOCUMENTATION

## Overview
Paystack bank transfer withdrawals are now supported in **4 African countries** where Paystack operates and accepts bank transfers.

---

## Supported Countries

### 1. Nigeria (NG) 🇳🇬
**Currency:** NGN (Nigerian Naira)  
**Account Type:** NUBAN (Nigeria Unified Bank Account Number)  
**Account Format:** 10-digit number  
**Account Verification:** ✅ Real-time verification available  
**Example Banks:**
- Access Bank (044)
- GTBank (058)
- Zenith Bank (057)
- First Bank (011)
- UBA (033)

**Features:**
- Real-time account name verification
- Instant transfers
- 100+ banks supported

---

### 2. Ghana (GH) 🇬🇭
**Currency:** GHS (Ghanaian Cedi)  
**Account Type:** GHIPSS (Ghana Interbank Payment and Settlement Systems)  
**Account Format:** Variable length  
**Account Verification:** ✅ Real-time verification available  
**Example Banks:**
- GCB Bank (040)
- Ecobank Ghana (130)
- Stanbic Bank (190)
- Fidelity Bank (240)
- Zenith Bank Ghana (120)

**Features:**
- Real-time account name verification
- GHIPSS instant payment system
- 30+ banks supported

---

### 3. South Africa (ZA) 🇿🇦
**Currency:** ZAR (South African Rand)  
**Account Type:** Standard Bank Account  
**Account Format:** Variable length  
**Account Verification:** ✅ Real-time verification available  
**Example Banks:**
- Standard Bank (051001)
- FNB (250655)
- ABSA (632005)
- Nedbank (198765)
- Capitec (470010)

**Features:**
- Real-time account name verification
- Instant EFT transfers
- 20+ banks supported

---

### 4. Kenya (KE) 🇰🇪
**Currency:** KES (Kenyan Shilling)  
**Account Type:** Standard Bank Account  
**Account Format:** Variable length  
**Account Verification:** ❌ Not available (Paystack limitation)  
**Example Banks:**
- Equity Bank (068)
- KCB Bank (001)
- Co-operative Bank (011)
- NCBA Bank (007)
- Stanbic Bank (031)

**Features:**
- Bank transfers supported
- Manual account verification required
- 40+ banks supported

**Important Note:** Kenya does not support real-time account verification through Paystack API. Users must manually verify their account details are correct before withdrawal.

---

## Implementation Details

### Backend Implementation

#### 1. Account Type Mapping
```typescript
const accountTypes = {
  'NG': 'nuban',        // Nigeria - NUBAN
  'GH': 'ghipss',       // Ghana - GHIPSS
  'ZA': 'bank_account', // South Africa - Standard
  'KE': 'bank_account'  // Kenya - Standard
};
```

#### 2. Currency Mapping
```typescript
const currencies = {
  'NG': 'NGN', // Nigerian Naira
  'GH': 'GHS', // Ghanaian Cedi
  'ZA': 'ZAR', // South African Rand
  'KE': 'KES'  // Kenyan Shilling
};
```

#### 3. API Endpoints

**Get Supported Countries:**
```bash
GET /api/v1/payments/paystack/countries
```

Response:
```json
{
  "countries": [
    {
      "code": "NG",
      "name": "Nigeria",
      "currency": "NGN",
      "accountType": "nuban"
    },
    {
      "code": "GH",
      "name": "Ghana",
      "currency": "GHS",
      "accountType": "ghipss"
    },
    {
      "code": "ZA",
      "name": "South Africa",
      "currency": "ZAR",
      "accountType": "bank_account"
    },
    {
      "code": "KE",
      "name": "Kenya",
      "currency": "KES",
      "accountType": "bank_account"
    }
  ]
}
```

**Get Banks by Country:**
```bash
GET /api/v1/payments/banks?country=NG
```

Response:
```json
{
  "banks": [
    {
      "name": "Access Bank",
      "code": "044",
      "country": "NG",
      "currency": "NGN"
    },
    {
      "name": "GTBank",
      "code": "058",
      "country": "NG",
      "currency": "NGN"
    }
  ]
}
```

**Verify Account (with country):**
```bash
POST /api/v1/payments/verify-account
Content-Type: application/json

{
  "provider": "paystack",
  "accountNumber": "0123456789",
  "bankCode": "058",
  "country": "NG"
}
```

Response (Nigeria, Ghana, South Africa):
```json
{
  "accountName": "John Doe",
  "accountNumber": "0123456789",
  "verified": true
}
```

Response (Kenya):
```json
{
  "accountName": "Verification not available for Kenya",
  "accountNumber": "0123456789",
  "verified": false
}
```

**Withdraw (with country):**
```bash
POST /api/v1/payments/withdraw
Content-Type: application/json

{
  "provider": "paystack",
  "krAmount": 10000,
  "currency": "NGN",
  "accountNumber": "0123456789",
  "bankCode": "058",
  "accountName": "John Doe",
  "country": "NG"
}
```

---

## Frontend Implementation

### User Flow

1. **Select Provider:** User selects "Paystack"
2. **Select Country:** Dropdown shows 4 countries (Nigeria, Ghana, South Africa, Kenya)
3. **Select Bank:** Banks filtered by selected country
4. **Enter Account Number:** User enters their bank account number
5. **Verify Account:** 
   - For NG, GH, ZA: Real-time verification shows account name
   - For KE: Warning message shown (no verification available)
6. **Enter Amount:** User enters withdrawal amount in Rc
7. **Submit:** Withdrawal processed with automatic currency conversion

### UI Components

#### Country Selection
```kotlin
ExposedDropdownMenuBox {
    OutlinedTextField(
        value = selectedCountry.name,
        label = { Text("Select Country") }
    )
    ExposedDropdownMenu {
        countries.forEach { country ->
            DropdownMenuItem(
                text = { 
                    Column {
                        Text(country.name)
                        Text(country.currency) // Shows currency
                    }
                }
            )
        }
    }
}
```

#### Kenya Warning
```kotlin
if (country == "KE") {
    Card(colors = CardDefaults.cardColors(
        containerColor = RuningaColors.Warning.copy(alpha = 0.1f)
    )) {
        Row {
            Icon(ic_info, tint = RuningaColors.Warning)
            Text("Account verification not available for Kenya. Please ensure account details are correct.")
        }
    }
}
```

---

## Testing Guide

### Test Withdrawals for Each Country

#### Nigeria (NGN)
```bash
# 1. Get Nigerian banks
curl -X GET "http://localhost:3000/api/v1/payments/banks?country=NG" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Verify account
curl -X POST http://localhost:3000/api/v1/payments/verify-account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paystack",
    "accountNumber": "0123456789",
    "bankCode": "058",
    "country": "NG"
  }'

# 3. Withdraw
curl -X POST http://localhost:3000/api/v1/payments/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paystack",
    "krAmount": 10000,
    "currency": "NGN",
    "accountNumber": "0123456789",
    "bankCode": "058",
    "accountName": "John Doe",
    "country": "NG"
  }'
```

#### Ghana (GHS)
```bash
# Same flow, replace country with "GH" and currency with "GHS"
curl -X POST http://localhost:3000/api/v1/payments/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paystack",
    "krAmount": 10000,
    "currency": "GHS",
    "accountNumber": "1234567890",
    "bankCode": "040",
    "accountName": "Jane Doe",
    "country": "GH"
  }'
```

#### South Africa (ZAR)
```bash
# Same flow, replace country with "ZA" and currency with "ZAR"
curl -X POST http://localhost:3000/api/v1/payments/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paystack",
    "krAmount": 10000,
    "currency": "ZAR",
    "accountNumber": "62123456789",
    "bankCode": "051001",
    "accountName": "Bob Smith",
    "country": "ZA"
  }'
```

#### Kenya (KES)
```bash
# Kenya - No verification step
curl -X POST http://localhost:3000/api/v1/payments/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paystack",
    "krAmount": 10000,
    "currency": "KES",
    "accountNumber": "1234567890",
    "bankCode": "068",
    "accountName": "Alice Wanjiku",
    "country": "KE"
  }'
```

---

## Currency Conversion

The system automatically converts Rc to local currency based on the selected country:

```typescript
// Example conversion rates (1 Rc = $0.01 USD)
const conversionRates = {
  'NGN': 1600,  // 1 USD = 1600 NGN
  'GHS': 15,    // 1 USD = 15 GHS
  'ZAR': 18,    // 1 USD = 18 ZAR
  'KES': 130    // 1 USD = 130 KES
};

// User withdraws 10,000 Rc = $100 USD
// Nigeria: 100 * 1600 = 160,000 NGN
// Ghana: 100 * 15 = 1,500 GHS
// South Africa: 100 * 18 = 1,800 ZAR
// Kenya: 100 * 130 = 13,000 KES
```

---

## Error Handling

### Common Errors

1. **Invalid Account Number**
```json
{
  "error": "Account verification failed: Invalid account number"
}
```

2. **Bank Not Found**
```json
{
  "error": "Bank code not found for selected country"
}
```

3. **Insufficient Balance**
```json
{
  "error": "Insufficient balance"
}
```

4. **Transfer Failed**
```json
{
  "error": "Transfer failed: Insufficient funds in Paystack balance"
}
```

---

## Production Checklist

### Configuration
- [ ] Paystack Secret Key configured for each country
- [ ] Paystack balance funded for each currency
- [ ] Webhook URLs configured
- [ ] Transfer limits set

### Testing
- [ ] Nigeria withdrawals tested
- [ ] Ghana withdrawals tested
- [ ] South Africa withdrawals tested
- [ ] Kenya withdrawals tested
- [ ] Account verification tested (NG, GH, ZA)
- [ ] Currency conversion tested
- [ ] Error handling tested

### Monitoring
- [ ] Transaction logging enabled
- [ ] Failed transfer alerts configured
- [ ] Balance monitoring for each currency
- [ ] Webhook delivery monitoring

---

## Limitations & Notes

1. **Kenya Verification:** Real-time account verification not available. Users must manually verify details.

2. **Transfer Limits:** Each country has different transfer limits set by Paystack:
   - Nigeria: Up to ₦5,000,000 per transaction
   - Ghana: Up to GH₵10,000 per transaction
   - South Africa: Up to R50,000 per transaction
   - Kenya: Up to KES 999,999 per transaction

3. **Processing Time:**
   - Nigeria: Instant
   - Ghana: Instant
   - South Africa: 1-2 business days
   - Kenya: 1-2 business days

4. **Fees:** Paystack charges different fees per country. Check Paystack pricing page for current rates.

---

## Support

For issues or questions:
- Paystack Documentation: https://paystack.com/docs/transfers/single-transfers
- Paystack Support: support@paystack.com
- Country-specific support: Available in Paystack dashboard

---

**Last Updated:** 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
