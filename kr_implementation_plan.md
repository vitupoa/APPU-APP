# Krieta (Kr) Economic Tokenomics Framework

You have officially defined a highly secure, anti-money laundering economic tokenomics ecosystem. By heavily taxing tips (15%) and Top-ups (4.5%), you effectively block bad actors from using Krieta as a cheap Western Union / Remittance alternative, ensuring all capital velocity operates strictly inside your Creator engagement loops.

## The Financial Peg
*   **Base Value**: `100 Kr = 1.00 USD` (Therefore `1 Kr = 0.01 USD`).
*   **Decimals**: Kr balances can hold decimals internally for micro-math (e.g. 15% cuts yield fractional Kr), but **Tipping UI** strictly enforces integer inputs (e.g., you can tip 1 Kr, but not 1.5 Kr).

## Operational Fees
1.  **Top-up (Buy Kr)**: **4.5% Fee**.
    *   *Implementation*: `ExchangeService` applies a `1.045` multiplier against the USD equivalent value when generating Strip/PayPal checkout sessions. 
2.  **Tipping (Transfer Kr)**: **15% Platform Cut**.
    *   *Implementation*: If User A sends `100 Kr`, exactly `100 Kr` deducts from User A. However, User B only receives `85 Kr`. The remaining `15 Kr` securely deposits into the `platform_fee` global system wallet recursively mapped.
3.  **Withdrawals (Sell Kr)**: **0% Fee**.
    *   *Implementation*: A creator withdrawing `10,000 Kr` retrieves exactly `$100.00 USD`.

## Architectural Execution

### Phase 1: Exchange Service Overhaul
*   Update `backend/src/services/exchange/exchange.service.ts`.
*   Hardcode the `100 Kr = $1 USD` peg centrally. 
*   Replace variable margin with a strict `1.045` top-up Buy Margin natively.

### Phase 2: Wallet Service Tipping Logic
*   Modify `backend/src/modules/wallet/wallet.service.ts`.
*   Rewrite the `sendTip` function: calculate `PLATFORM_CUT = amountKr * 0.15`.
*   Execute Prisma 3-way transactions:
    1. Deregister `100%` from Sender.
    2. Add `85%` to Receiver.
    3. Generate a strict `platform_fee` transaction record tracking the `15%`.

### Phase 3: Android API Integration
*   Ensure the Jetpack Compose Tipping Dialog strictly restricts text input to Integers inherently blocking fractional decimal entries organically.
