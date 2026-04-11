# Krieta Security & Wallet Defense Architecture

You have raised critical security insights defining the difference between a minimum viable product and a production-grade FinTech application.

## 1. Authentication Status (Forgot Password & Email OTP)
Currently, users are instantly generated upon hitting `/register`.
**We must build the OTP Engine:**
1.  **Sign-up Verification:** We will implement an endpoint that physically generates a 6-digit OTP, stores it in Redis (with a 10-minute expiry), and dispatches it via a Mailer (e.g., AWS SES / SendGrid). Users cannot access the platform until passing `POST /auth/verify-email`.
2.  **Forgot Password:** Same mechanism. `POST /auth/forgot-password` generates an OTP. The user submits the OTP with their new password to securely reset it without relying on archaic email links.

## 2. Withdrawal Security Validation
Currently, any user holding the JWT access token can trigger a withdrawal. If someone snatches an unlocked phone, they can drain the Kr balance.
**The Fix:**
Every withdrawal request *MUST* include the user's explicit Wallet PIN. The backend will verify `Bcrypt.compare(providedPin, user.walletPinHash)`. If it fails, the withdrawal rejects entirely. For modern devices, we map this to Android's Native Biometrics (Fingerprint/FaceID) triggering the token natively.

## 3. The 6-Digit PIN vs 4-Digit PIN
**Recommendation: 6-Digit PIN.**
*   A 4-digit PIN has 10,000 combinations. A 6-digit PIN has 1,000,000 combinations. It is 100x more secure against shoulder-surfing and brute force. CashApp and Apple both mandate 6-digits today.
*   **The 15-Minute Timeout Limit:** I will build an Android Lifecycle observer intercepting local sessions. If `System.currentTimeMillis() - lastActiveTime > 15 Minutes` evaluates true, the Voyager Navigator inherently intercepts and forces the `/wallet-unlock` screen demanding the 6-digit PIN before showing Kr balances.

## 4. Toggle Balances (Hide/Show Kr & Fiat)
I will implement an `isBalanceHidden: Boolean` flow in Jetpack Compose's `WalletViewModel` stored in local DataStore. When toggled, the UI elegantly renders `Kr ****` and `~ $**.**`, securing users physically displaying their App in public spaces.

> [!IMPORTANT]
> **Database Overhaul Required:** I will need to push changes to the Prisma Schema adding `walletPinHash`, `pinUpdatedAt`, and `isEmailVerified` attributes seamlessly. 

## Open Questions

1.  **Email Provider:** Are you currently planning to use AWS SES, SendGrid, or Resend to send these actual OTP emails? I will mock the Mailer class for now, but identifying the provider streamlines final physical deployments!
2.  **PIN Requirement Setup:** Should we *force* users to set up their 6-Digit PIN immediately after Signup, or should we only force them to define a PIN the very first time they click the "Wallet Tracker" tab? (I recommend deferring setup to the Wallet tab to reduce onboarding friction globally).
