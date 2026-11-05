# Runinga E2E Production Architecture Plan

This document details the comprehensive implementation phases merging the newly requested Backend scaling functionality (Security, Storage, Real-time messaging) and mapping the currently disconnected KMP Frontend Repository Modules organically to Live Express APIs operating concurrently down to your newly minted Railway PostgreSQL database.

## Phase 1: Heavy Security Upgrades & Validations
- **Environment Context:** Register `REQUEST_SIGNING_KEY`, `RATE_LIMIT_MAX`, and `RATE_LIMIT_WINDOW_MS` inside `env.ts` reflecting values manually configured in Railway and local `.env`.
- **Dynamic Rate Limiting:** Overhaul `middleware/rateLimiter.ts` to consume numeric limits from environment configurations while retaining stricter routing constraints for auth/money endpoints.
- **Zod Standardizations:** Implement `validateRequest(zodSchema)` generic middleware, ensuring all backend incoming requests perfectly adhere to the Prisma constraints natively mapped by Zod definitions before processing payloads.
- **PII Logger Redaction:** Implement a privacy wrapper middleware filtering standard log exports protecting Sensitive data strings (Emails, Password Hashes, Phone numbers).

## Phase 2: Restructuring Cloudinary Multi-Module Hierarchy
Rewrite configurations inside `src/config/cloudinary.ts` and their respective upload routes. 
- Overhaul upload definitions to natively resolve to dynamic module schemas explicitly defined natively: `Runinga/{Module}/(Videos|Images|Audio)`.
- **Thumbnail Auto-generation Strategy**: Adapt generation utilities allocating dedicated configurations isolating files into their localized directories specifically natively mapping images inside `Runinga/{Module}/Images/thumbnail` and videos into `Runinga/{Module}/Videos/thumbnail` seamlessly mapping associations without external clutter issues.

## Phase 3: Redis WebSocket Event Pipeline
Convert the generic Socket.io single-server configuration located in `index.ts` to a clustered production-ready implementation leveraging Railway's natively provisioned Redis engine.
- Integrate `@socket.io/redis-adapter` bridging instance node communications correctly.
- Structure Event pipelines constructing a `shared/gateway` module allocating fast concurrent Redis pub/sub channel configurations natively processing notifications and message races efficiently.

## Phase 4: KMP Repository De-Stubbing & End-to-End Migration
Systematically isolate and rewrite all Android KMP module Data-Layers.
We will sequentially move through these modules, dropping all hardcoded mock arrays and substituting authentic `Ktor` suspended HTTP calls querying the precise Express APIs.

**Initial Mapping Execution Strategy:**
1. **[Auth & Identity]**: `AuthRepositoryImpl` & Profile logic 
2. **[Feed & Discovery]**: `FeedRepositoryImpl`
3. **[Social Engagements]**: `SocialRepositoryImpl`
4. **[Wallet & Payments]**: `WalletRepositoryImpl`
5. **[Analytics]**: `AnalyticsRepositoryImpl`

> [!WARNING]
> While migrating KMP repositories natively resolving against Prisma Express routing algorithms, we manually ensure Serialization objects cleanly bypass variable collision strictly asserting JSON parsing.

## Open Questions

- Regarding the Cloudinary Thumbnail structures: Do you want the thumbnails generated asynchronously via Cloudinary Image Transformation APIs, or structured purely logic-side where Express builds the thumbnail and uploads it concurrently into the `thumbnail/` folder during the primary asset upload process?
- Since you provisioned PostgreSQL in Railway, have you definitively linked the live Connection String into the `DATABASE_URL` within your active `.env` file, or should we execute a generic `npx prisma db push` targeting the local server URL during this implementation phase?
