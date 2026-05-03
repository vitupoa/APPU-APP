# Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                          │
│                    (Browser/Mobile App)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      1. NETWORK LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ HTTPS/TLS (Railway automatic)                         │  │
│  │ ✅ Trust Proxy (IP extraction)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   2. SECURITY HEADERS                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Helmet (CSP, HSTS, X-Frame-Options, etc.)            │  │
│  │ ✅ CORS (origin validation)                             │  │
│  │ ✅ Additional Headers (cache control, permissions)      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. BODY PARSING                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ JSON Parser (10MB limit)                             │  │
│  │ ✅ URL Encoded Parser                                   │  │
│  │ ✅ Cookie Parser                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. RATE LIMITING                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ User-based Rate Limiter (100 req/15min)             │  │
│  │ ✅ IP-based Rate Limiter (prevents anonymous abuse)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│                    ❌ Too Many Requests?                        │
│                             │                                   │
│                    YES ─────┴────► 429 Response                │
│                             │                                   │
│                            NO                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  5. INPUT SANITIZATION                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Sanitize Inputs (XSS, SQL injection)                 │  │
│  │ ✅ Prevent Path Traversal (../ filtering)              │  │
│  │ ✅ Prevent Command Injection (dangerous chars)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│                    ❌ Malicious Input?                          │
│                             │                                   │
│                    YES ─────┴────► 400 Response                │
│                             │                                   │
│                            NO                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   6. AUTHENTICATION                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ JWT Verification                                     │  │
│  │ ✅ Token Expiry Check                                   │  │
│  │ ✅ User Context Extraction                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│                    ❌ Invalid Token?                            │
│                             │                                   │
│                    YES ─────┴────► 401 Response                │
│                             │                                   │
│                            NO                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                7. ROW-LEVEL SECURITY (RLS)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Set PostgreSQL session variable                      │  │
│  │ ✅ app.current_user_id = user.id                        │  │
│  │ ✅ Database enforces access policies                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  8. OWNERSHIP VALIDATION                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Verify user owns the resource                        │  │
│  │ ✅ Check permissions (admin, creator, etc.)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│                    ❌ Not Authorized?                           │
│                             │                                   │
│                    YES ─────┴────► 403 Response                │
│                             │                                   │
│                            NO                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   9. BUSINESS LOGIC                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Process request                                      │  │
│  │ ✅ Database operations (with RLS)                       │  │
│  │ ✅ External API calls (if needed)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                10. RESPONSE FILTERING                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Remove sensitive fields (password, tokens, etc.)     │  │
│  │ ✅ Remove rate limit counters                           │  │
│  │ ✅ Remove internal flags                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    11. RESPONSE HEADERS                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Security headers (CSP, HSTS, etc.)                   │  │
│  │ ✅ Cache control (for sensitive data)                   │  │
│  │ ✅ Rate limit headers (X-RateLimit-*)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUCCESS RESPONSE                           │
│                         200/201                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Special Flows

### Webhook Flow (PayPal, Paystack, M-Pesa)
```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK REQUEST                              │
│              (From Payment Provider)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  1. IP WHITELISTING                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Check if IP is from payment provider                 │  │
│  │ ✅ M-Pesa: Safaricom IPs only                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│                    ❌ Invalid IP?                               │
│                             │                                   │
│                    YES ─────┴────► 403 Response                │
│                             │                                   │
│                            NO                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               2. SIGNATURE VERIFICATION                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Verify webhook signature                             │  │
│  │ ✅ PayPal: Verify-Signature header                      │  │
│  │ ✅ Paystack: X-Paystack-Signature header                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│                    ❌ Invalid Signature?                        │
│                             │                                   │
│                    YES ─────┴────► 401 Response                │
│                             │                                   │
│                            NO                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  3. PROCESS WEBHOOK                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Update payment status                                │  │
│  │ ✅ Update wallet balance                                │  │
│  │ ✅ Send notification to user                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      200 OK RESPONSE                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow (User-Initiated)
```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND REQUEST                             │
│              (User clicks "Pay Now")                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND VALIDATION                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Authenticate user                                     │  │
│  │ ✅ Validate amount (no negative, no manipulation)       │  │
│  │ ✅ Check user balance (if applicable)                   │  │
│  │ ✅ Sanitize inputs                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND CALLS PAYMENT PROVIDER                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ PayPal: Create order (backend only)                  │  │
│  │ ✅ Paystack: Initialize transaction (backend only)      │  │
│  │ ✅ M-Pesa: STK push (backend only)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ⚠️  FRONTEND NEVER CALLS PAYMENT PROVIDER DIRECTLY            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RETURN PAYMENT URL/TOKEN                       │
│              (Frontend redirects user)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER COMPLETES PAYMENT                         │
│              (On payment provider's site)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WEBHOOK RECEIVED                               │
│              (See Webhook Flow above)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Security Principles

### Defense in Depth
Multiple layers of security ensure that if one layer fails, others still protect:
1. Network (HTTPS, CORS)
2. Headers (CSP, HSTS)
3. Rate Limiting (IP + user)
4. Input Validation (sanitization)
5. Authentication (JWT)
6. Authorization (RLS + ownership)
7. Response Filtering (sensitive data)

### Principle of Least Privilege
- Users can only access their own data (RLS)
- Users can only modify what they own (ownership validation)
- Webhooks can only be called by payment providers (IP whitelist + signature)
- Frontend cannot manipulate payments (backend-only processing)

### Zero Trust
- Never trust user input (sanitize everything)
- Never trust frontend (validate on backend)
- Never trust external requests (verify signatures)
- Never expose sensitive data (filter responses)

---

## Security Checklist

- ✅ HTTPS enforced (Railway automatic)
- ✅ Security headers configured
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input sanitization applied
- ✅ Authentication required
- ✅ RLS enabled
- ✅ Ownership validation
- ✅ Webhook security
- ✅ Payment security
- ✅ Sensitive data filtered
- ✅ Environment variables secured

**Your backend is production-ready! 🚀**
