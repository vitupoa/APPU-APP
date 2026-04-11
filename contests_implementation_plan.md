# Enterprise Contest Ecosystem Overhaul

You are building an entirely gamified marketing ecosystem. This architecture shifts Contests from simple galleries into a massive engine driving user growth, brand conversions, and FOMO urgency.

---

## Part 1: Schema Redesign & Express Logistics

### 1. The Core Contest Model Expansion
*   **Monetization**: `entryFeeKr` (Funds inflate the overarching `prizeTotalKr`).
*   **Combination Weighting**: Add `publicVoteWeight` (Int layout 0-100) allocating the physical slider choice mapping percentage weights properly.
*   **Demographic Locks**: `targetAges`, `targetGeos`.
*   **FOMO Pools**: Implement `airdropKr` and `airdropParticipantCount` (First X participants get guaranteed Kr!).
*   **Pre-Funding Security**: Natively validate Creators have `$PrizePool + $DailyPools + $Airdrops` inside their `wallet.krBalance`. Prisma will freeze/escrow this natively before the contest status hits `ACTIVE`.

### 2. Post-Contest Fraud Escrow System (The "Trust but Verify" Solution)
To resolve the exact risk you raised regarding fraudulent screenshot uploads withdrawing money immediately:
*   Contests will NOT automatically distribute funds to a wallet `krBalance` immediately upon ending.
*   Instead, they enter a mandatory `JUDGING_REVIEW` status (e.g., locking for 72 Hours). 
*   The Backend calculates the winners algorithmically based on Votes/Scores, but places their rewards into a `"pending_release"` state.
*   **Moderation Flow**: Judges check their assigned Dashboard purely looking at the Top Winners' submitted proof. If the #1 winner uploaded fake/blank screenshots, the Judge hits **Disqualify**. The Algorithm instantly recalculates natively kicking #2 into the 1st place slot! 
*   Once Judges physically hit **Release Funds**, the Kr permanently enters the clean user wallets. 

### 3. Requirements Tracking (`ContestRequirement` & `ContestVerification`)
Brands can construct requirements out of 8 templates natively mapping social hooks!
*   **Tables**: Create `ContestRequirement` defining type (`YOUTUBE_SUB`, `SPOTIFY_FOLLOW`, `TIKTOK_FOLLOW`, `SHOP_VISIT`, `CUSTOM`).
*   **Verification**: Create `RequirementVerification` mapping users uploading Proof (Screenshots via Cloudinary).

### 4. Cron Automated Daily Engine
*   Build an Express background thread utilizing `node-cron`. Every 24 hours, it queries all Contests marked with `allowDailyPrizes = true`.
*   The script autonomously queries all Valid submissions within the last 24h, executes a cryptographically secure random selection, awards the winner their `dailyPrizeKr` natively to their actual wallets, and updates WebSockets.

---

## Part 2: Android KMP Jetpack Compose UI

### 1. Brand Creation 5-Step Wizard
*   A fluid `Pager`-based Compose layout (`ContestCreationWizard.kt`).
*   **Combination Logic Slider**: A native slider allowing the brand to dial "70% Public Votes / 30% Judge Score".

### 2. Dual-Layer Detail View & Discovery Mode
*   **Leaderboard**: Seamlessly leveraging WebSockets updating LIVE when competitors ascend, triggering the "Share to Vote" Viral loop prompt.

### 3. Tinder/TikTok Engagement Pipeline
*   **Voting Feed**: `Modifier.draggable` implementation rendering `ExoPlayer`. Auto-playing only the *Top* card! Underneath cards compress into caching thumbnails eliminating UI jank beautifully.

## Legal Insight: Casino Operations & Sweepstakes
> [!CAUTION]
> **Pay-To-Vote Mechanisms**
> If you require users to *pay* to vote, or *pay* to enter, and the pool operates on chance or public voting loops resulting in massive cash payouts, it inherently triggers international **Sweepstakes & Lottery Laws**. 
> You would require explicit terms of service, bonding permits, and usually a "No Purchase Necessary" free alternative. 

> [!TIP]
> **The Best Gamification Path**
> **Remove voting fees entirely**. Voting must be 100% free and frictionless. This is how you drive "FOMO" and algorithmic virality. If people have to pay to swipe, nobody will swipe. 
> **How you monetize:** The Brands/Creators pay the Platform. When a brand creates a $10,000 contest, Krieta takes 15% ($1,500) upfront. The brand gets 100,000 real TikTok followers for free because voting is frictionless. This protects you entirely from Casino laws because users are never risking their own money natively!
