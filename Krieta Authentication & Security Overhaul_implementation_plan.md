# Krieta Authentication & Security Overhaul

This plan outlines the specific security restructuring defining the removal of expensive phone-based auth alongside executing the robust 6-Digit Wallet PIN limits.

## Strategic Business Answers (Auth Economics)

**1. Drop Phone Auth entirely?**
**YES.** SMS OTPs are notoriously expensive globally (ranges from $0.05 to $0.15 USD per text in emerging markets). Scaling to just 10,000 signups could cost you $1,000 instantly. Email is practically free. We will strip the `phone` requirement natively from signups.

**2. Can we use Gmail for OTP emails?**
**YES.** For startup phases, we will use **NodeMailer connected to an Official Gmail Account via "App Passwords."** It is 100% free! It limits you to 500 emails per day natively. Once you exceed 500 signups daily, you simply swap the URL to **Resend** (which is incredibly cheap/free for the first 30,000 emails)!

**3. Is Redis secure? Where is the OTP generated?**
The OTP is generated securely on the **Backend Node Express Server** natively using `Crypto` Math. The frontend never touches its logic. Storing it in Redis is mathematically bulletproof because the object physically deletes itself (TTL) after exactly 10 minutes. Even if a hacker breaches the database, the code literally does not exist there.

**4. Will OTP slow down signups?**
Yes, it adds roughly ~25 seconds of friction. However, in an ecosystem explicitly moving real Fiat and Kr Tokens, this friction is *mandatory*. It prevents "Bot Farms" from generating 50,000 fake accounts completely draining your system.

## Proposed Modifications

1.  **Backend Auth Service (`auth.service.ts`):** 
    *   Construct `sendEmailOTP()` utilizing NodeMailer (Gmail Configuration).
    *   Inject `verifyEmailOTP()` matching the `Crypto` strings seamlessly against Redis.
2.  **Prisma DB Evolution (`schema.prisma`):**
    *   Add `walletPinHash String?` mapping locally to User setups natively.
    *   Remove `phone` dependencies natively.
3.  **Frontend Wallet Defenses (`WalletScreen.kt` & `PinSetupScreen.kt`):**
    *   As you requested, users sign up without friction! 
    *   Only when they tap the **`WALLET`** Tab for the first time implicitly, Voyager routing will hijack the screen demanding a **6-Digit PIN Setup.**
4.  **Balance Obscuration (`Kr ***`):**
    *   Inject a floating "Eye Icon" inside `WalletScreen` mapping locally to `Boolean` DataStore limits toggling numeric displays natively!

> [!IMPORTANT]
> **User Review Required:** Upon your approval of this explicit Gmail/NodeMailer + Wallet Screen deferral logic, I will execute the backend/frontend logic and run the Git Push routines automatically!
