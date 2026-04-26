# RembrandtRAR — Implementation Plan

## Phase Overview

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Schema + RBAC + Middleware + Auth | 🔨 Building |
| **2** | User Management + Content Moderation | ⏳ Pending |
| **3** | Financial Controls + Withdrawal Approval | ⏳ Pending |
| **4** | Feature Flags + Platform Config | ⏳ Pending |
| **5** | Analytics + Audit Logs + Communication | ⏳ Pending |
| **6** | Web Dashboard UI + Hosting Guide | ⏳ Pending |

## API Route Structure
All routes under `/api/v1/rar/` (no "admin" naming)

```
/api/v1/rar/dashboard       → Overview stats
/api/v1/rar/users            → User management
/api/v1/rar/content          → Content moderation
/api/v1/rar/contests         → Contest management
/api/v1/rar/shop             → Product moderation
/api/v1/rar/wallet           → Financial oversight
/api/v1/rar/chamas           → Chama monitoring
/api/v1/rar/marketplace      → Brand marketplace
/api/v1/rar/reports          → User reports
/api/v1/rar/analytics        → Platform analytics
/api/v1/rar/settings         → System configuration
/api/v1/rar/logs             → Audit logs
/api/v1/rar/feature-flags    → Feature flags
/api/v1/rar/withdrawals      → Withdrawal management
/api/v1/rar/names            → Prohibited/reserved names
/api/v1/rar/announcements    → Platform announcements
/api/v1/rar/roles            → Admin role management
```

## Admin Roles
- **SUPER_ADMIN** — Full access
- **CONTENT_MODERATOR** — Content review only
- **FINANCIAL_ADMIN** — Wallet + transactions
- **SUPPORT_ADMIN** — User support + disputes
- **MARKETING_ADMIN** — Campaigns + promotions
- **ANALYTICS_ADMIN** — Read-only analytics
- **SECURITY_ADMIN** — Audit logs + IP banning
- **COMMUNITY_MANAGER** — Chama + social oversight

## Security Layers
1. JWT auth (existing)
2. `isAdmin` boolean check (JWT claim)
3. AdminProfile DB lookup (role verification)
4. Permission matrix per role
5. Audit log for every admin action
6. IP + User-Agent tracking
7. Stricter rate limiting on RAR routes
