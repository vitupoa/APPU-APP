# Rc Currency - Complete Explanation

## What is Rc?

**Rc** (pronounced "Runinga") is the in-app virtual currency used throughout the Runinga platform. It serves as the unified medium of exchange for all transactions within the ecosystem.

## Display Format

- **Format**: `Rc. [amount]` (with space after the dot)
- **Examples**: 
  - `Rc. 500`
  - `Rc. 0.50`
  - `Rc. 1`

## Exchange Rate System

### Base Peg
**Rc. 1 = $100.00 USD** (fixed base rate)

This is the fundamental peg that all other currency conversions are based on.

### How It Works
- **Fiat to Rc**: Divide USD amount by 100
  - Example: $500 USD ÷ 100 = Rc. 5
- **Rc to Fiat**: Multiply Rc amount by 100
  - Example: Rc. 5 × 100 = $500 USD

### Current Exchange Rates (Approximate)

| Amount | USD | KES (Kenyan Shilling) | KWD (Kuwaiti Dinar) |
|--------|-----|----------------------|---------------------|
| **Rc. 1** | $100.00 | ~KES 13,000 | ~KWD 30.70 |
| **Rc. 0.01** | $1.00 | ~KES 130 | ~KWD 0.307 |
| **Rc. 10** | $1,000.00 | ~KES 130,000 | ~KWD 307 |
| **Rc. 100** | $10,000.00 | ~KES 1,300,000 | ~KWD 3,070 |

*Note: KES and KWD rates are based on current market exchange rates and may fluctuate.*

## Platform Fees & Margins

### Top-up (Buy Rc)
- **4.5% platform margin** applied to exchange rate
- **KES 20 invisible fee** embedded in the rate
- User receives LESS Rc per dollar spent

### Withdrawal (Sell Rc)
- **0% margin** on exchange rate
- **KES 1 flat fee** deducted from wallet
- User receives full market rate (minus flat fee)

### Platform Fees (15%)
Applied to:
- Contest prizes
- Subscription payments
- Tips between users

### Display Rate
- Balance display uses a **KES 30 downward adjustment**
- Makes displayed fiat equivalent slightly lower than actual value
- Only affects display, not actual transactions

## Use Cases

Rc can be used for:
- **Tipping creators** (15% platform fee)
- **Contest entry fees and prizes** (15% platform fee)
- **Subscription payments** (15% platform fee)
- **Shop purchases**
- **Ad revenue earnings**
- **Wallet top-ups** (4.5% margin + KES 20 fee)
- **Withdrawals** (KES 1 flat fee)

## Example Calculations

### Top-up Example (KES → Rc)
1. User wants to top up KES 1,300
2. Base rate: 1 USD = 130 KES, so Rc. 1 = KES 13,000
3. Without fees: KES 1,300 ÷ 13,000 = Rc. 0.1
4. With 4.5% margin: Rc. 0.1 × 0.955 = Rc. 0.0955
5. With KES 20 fee: Further reduced slightly
6. **User receives: ~Rc. 0.095**

### Withdrawal Example (Rc → KES)
1. User wants to withdraw Rc. 1
2. Base rate: Rc. 1 = KES 13,000
3. No margin applied (0%)
4. KES 1 flat fee deducted
5. **User receives: ~KES 12,999**

### Tip Example
1. User tips Rc. 10
2. Platform takes 15% fee: Rc. 1.5
3. **Recipient receives: Rc. 8.5**

## Technical Implementation

### Backend
- Exchange rates fetched from external API (fawazahmed0)
- Cached for 5 minutes
- Base peg: `1 Rc = 100 USD`
- Conversion functions:
  - `getKrFromUSD(usdAmount)`: usdAmount / 100
  - `getUSDFromKr(krAmount)`: krAmount * 100

### Frontend (Kotlin)
- `KrCurrencyFormatter.formatKr(amount)`: Formats Rc amounts
- `KrCurrencyFormatter.formatKrWithFiat()`: Shows Rc with fiat equivalent
- `KrAmountDisplay`: Composable component for displaying Rc amounts

## Supported Currencies

The platform supports 100+ currencies including:
- **USD** (US Dollar)
- **KES** (Kenyan Shilling)
- **KWD** (Kuwaiti Dinar)
- **NGN** (Nigerian Naira)
- **GHS** (Ghanaian Cedi)
- **ZAR** (South African Rand)
- **EUR** (Euro)
- **GBP** (British Pound)
- And many more...

## Payment Methods

### Top-up Methods
- **M-Pesa** (Kenya only)
- **Paystack** (Nigeria, Ghana, South Africa, Kenya)
- **PayPal** (International - card payments)

### Withdrawal Methods
- **M-Pesa** (Kenya only)
- **Payoneer** (International)

---

**Last Updated**: January 2025
