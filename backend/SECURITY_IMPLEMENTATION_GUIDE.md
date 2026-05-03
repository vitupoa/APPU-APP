# 🔒 KRIETA SECURITY IMPLEMENTATION GUIDE

This guide provides step-by-step instructions to implement all security fixes identified in the security audit.

---

## 📋 PREREQUISITES

Before starting, ensure you have:
- [ ] Database backup
- [ ] Access to production environment
- [ ] AWS account (for Secrets Manager)
- [ ] Redis instance running
- [ ] All team members notified of maintenance window

---

## 🚀 PHASE 1: IMMEDIATE CRITICAL FIXES (Day 1)

### 1.1 Enable Row-Level Security (RLS)

**Priority:** CRITICAL
**Time:** 30 minutes
**Downtime:** None

#### Steps:

1. **Run the RLS migration:**
   ```bash
   cd backend
   psql $DATABASE_URL -f prisma/migrations/enable_row_level_security.sql
   ```

2. **Verify RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('users', 'wallets', 'transactions');
   ```
   All should show `rowsecurity = true`

3. **Update your Express app to set RLS context:**
   
   **File:** `backend/src/index.ts`
   ```typescript
   import { rlsMiddleware } from './middleware/rls.js';
   import { authMiddleware } from './middleware/auth.js';
   
   // Apply RLS middleware AFTER auth middleware
   app.use(authMiddleware);
   app.use(rlsMiddleware);
   ```

4. **Test RLS policies:**
   ```bash
   npm run test:rls
   ```

#### Verification:
- [ ] RLS enabled on all tables
- [ ] Users can only access their own data
- [ ] Admins can access all data
- [ ] No errors in application logs

---

### 1.2 Add IP Whitelisting for Webhooks

**Priority:** CRITICAL
**Time:** 15 minutes
**Downtime:** None

#### Steps:

1. **Update webhook routes:**
   
   **File:** `backend/src/routes/webhook.routes.ts`
   ```typescript
   import { 
     paypalWebhookWhitelist,
     paystackWebhookWhitelist,
     mpesaWebhookWhitelist
   } from '../middleware/ipRateLimiter.js';
   
   // PayPal webhooks - ADD IP WHITELIST
   router.post('/paypal', 
     paypalWebhookWhitelist,  // ← ADD THIS
     express.raw({ type: 'application/json' }), 
     WebhookController.handlePayPalWebhook
   );
   
   // Paystack webhooks - ADD IP WHITELIST
   router.post('/paystack', 
     paystackWebhookWhitelist,  // ← ADD THIS
     express.json(), 
     WebhookController.handlePaystackWebhook
   );
   
   // M-Pesa callback - ADD IP WHITELIST
   router.post('/mpesa/callback', 
     mpesaWebhookWhitelist,  // ← ADD THIS
     express.json(), 
     WebhookController.handleMpesaCallback
   );
   ```

2. **Test webhooks:**
   ```bash
   # Test from allowed IP (use PayPal sandbox)
   curl -X POST https://your-api.com/webhooks/paypal \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   
   # Test from disallowed IP (should fail)
   curl -X POST https://your-api.com/webhooks/paypal \
     -H "X-Forwarded-For: 1.2.3.4" \
     -d '{"test": "data"}'
   ```

#### Verification:
- [ ] Webhooks only accept requests from whitelisted IPs
- [ ] Test webhooks from PayPal/Paystack/M-Pesa work
- [ ] Requests from other IPs are rejected with 403

---

### 1.3 Add Ownership Validation

**Priority:** CRITICAL
**Time:** 30 minutes
**Downtime:** None

#### Steps:

1. **Update user routes:**
   
   **File:** `backend/src/modules/user/user.routes.ts`
   ```typescript
   import { 
     validateProfileOwnership,
     preventSensitiveFieldModification
   } from '../../middleware/ownership.js';
   
   // Protect profile update
   router.put('/:userId', 
     authMiddleware,
     validateProfileOwnership,  // ← ADD THIS
     preventSensitiveFieldModification,  // ← ADD THIS
     UserController.updateProfile
   );
   ```

2. **Update wallet routes:**
   
   **File:** `backend/src/modules/wallet/wallet.routes.ts`
   ```typescript
   import { validateWalletOwnership } from '../../middleware/ownership.js';
   
   // All wallet routes require ownership validation
   router.use(authMiddleware);
   router.use(validateWalletOwnership);  // ← ADD THIS
   ```

3. **Update KYC routes:**
   
   **File:** `backend/src/modules/kyc/kyc.routes.ts`
   ```typescript
   import { validateWithdrawalOwnership } from '../../middleware/ownership.js';
   
   // Protect withdrawal history
   router.get('/withdrawal/history', 
     authenticateToken,
     validateWithdrawalOwnership,  // ← ADD THIS
     async (req: AuthRequest, res) => {
       // ...
     }
   );
   ```

#### Verification:
- [ ] Users cannot update other users' profiles
- [ ] Users cannot access other users' wallets
- [ ] Users cannot view other users' withdrawals
- [ ] Test with different user IDs

---

### 1.4 Remove Sensitive Data from API Responses

**Priority:** HIGH
**Time:** 20 minutes
**Downtime:** None

#### Steps:

1. **Update user service:**
   
   **File:** `backend/src/modules/user/user.service.ts`
   ```typescript
   static async getProfile(userId: string, viewerId?: string) {
     const user = await prisma.user.findUniqueOrThrow({
       where: { id: userId },
       select: {
         id: true,
         username: true,
         firstName: true,
         lastName: true,
         displayName: true,
         avatarUrl: true,
         coverPhotoUrl: true,
         bio: true,
         country: true,
         // ❌ REMOVE THESE:
         // isWalletUnlocked: true,
         // kycStatus: true,
         // currency: true,
         isVerified: true,
         createdAt: true
       }
     });
     
     // Only return sensitive data for own profile
     if (viewerId === userId) {
       return {
         ...user,
         isWalletUnlocked: user.isWalletUnlocked,
         kycStatus: user.kycStatus,
         currency: user.currency
       };
     }
     
     return user;
   }
   ```

2. **Update KYC service:**
   
   **File:** `backend/src/modules/kyc/kyc.service.ts`
   ```typescript
   async getKYCStatus(userId: string) {
     // ❌ REMOVE dailyLimit from response
     return {
       kycStatus: user?.kycStatus || 'NOT_STARTED',
       documents: kycDocuments,
       // dailyLimit: withdrawalLimit?.dailyLimitKr || DAILY_WITHDRAWAL_LIMIT,  // ← REMOVE
       withdrawnToday: withdrawalLimit?.withdrawnTodayKr || 0
     };
   }
   ```

#### Verification:
- [ ] Public profiles don't expose sensitive data
- [ ] Own profile shows all data
- [ ] Rate limits not exposed in responses

---

### 1.5 Implement IP-Based Rate Limiting

**Priority:** HIGH
**Time:** 20 minutes
**Downtime:** None

#### Steps:

1. **Update main app:**
   
   **File:** `backend/src/index.ts`
   ```typescript
   import { apiRateLimiter } from './middleware/ipRateLimiter.js';
   
   // Apply global rate limiting
   app.use(apiRateLimiter);
   ```

2. **Update auth routes:**
   
   **File:** `backend/src/modules/auth/auth.routes.ts`
   ```typescript
   import { authRateLimiter } from '../../middleware/ipRateLimiter.js';
   
   router.post('/login', authRateLimiter, AuthController.login);
   router.post('/register', authRateLimiter, AuthController.register);
   ```

3. **Update payment routes:**
   
   **File:** `backend/src/modules/wallet/wallet.routes.ts`
   ```typescript
   import { paymentRateLimiter, withdrawalRateLimiter } from '../../middleware/ipRateLimiter.js';
   
   router.post('/topup/initiate', paymentRateLimiter, WalletController.initiateTopup);
   router.post('/withdraw', withdrawalRateLimiter, WalletController.withdraw);
   ```

#### Verification:
- [ ] Rate limiting works per IP
- [ ] Rate limiting works per user
- [ ] Blocked users see appropriate error messages
- [ ] Rate limit headers are present

---

## 🔐 PHASE 2: HIGH PRIORITY FIXES (Week 1)

### 2.1 Move Secrets to AWS Secrets Manager

**Priority:** HIGH
**Time:** 1 hour
**Downtime:** 5 minutes (during deployment)

#### Steps:

1. **Install AWS SDK:**
   ```bash
   npm install @aws-sdk/client-secrets-manager
   ```

2. **Create secrets in AWS:**
   ```bash
   aws secretsmanager create-secret \
     --name krieta/production/database \
     --secret-string '{"url":"postgresql://..."}'
   
   aws secretsmanager create-secret \
     --name krieta/production/jwt \
     --secret-string '{"access":"...","refresh":"..."}'
   
   aws secretsmanager create-secret \
     --name krieta/production/paypal \
     --secret-string '{"clientId":"...","clientSecret":"..."}'
   
   aws secretsmanager create-secret \
     --name krieta/production/paystack \
     --secret-string '{"secretKey":"...","publicKey":"..."}'
   
   aws secretsmanager create-secret \
     --name krieta/production/mpesa \
     --secret-string '{"consumerKey":"...","consumerSecret":"..."}'
   ```

3. **Create secrets loader:**
   
   **File:** `backend/src/config/secrets.ts`
   ```typescript
   import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
   
   const client = new SecretsManagerClient({ region: 'us-east-1' });
   
   export async function loadSecrets() {
     const secrets = {
       database: await getSecret('krieta/production/database'),
       jwt: await getSecret('krieta/production/jwt'),
       paypal: await getSecret('krieta/production/paypal'),
       paystack: await getSecret('krieta/production/paystack'),
       mpesa: await getSecret('krieta/production/mpesa')
     };
     
     return secrets;
   }
   
   async function getSecret(secretName: string) {
     const command = new GetSecretValueCommand({ SecretId: secretName });
     const response = await client.send(command);
     return JSON.parse(response.SecretString || '{}');
   }
   ```

4. **Update env.ts:**
   
   **File:** `backend/src/config/env.ts`
   ```typescript
   import { loadSecrets } from './secrets.js';
   
   let secrets: any = null;
   
   export async function initializeSecrets() {
     if (process.env.NODE_ENV === 'production') {
       secrets = await loadSecrets();
     }
   }
   
   export function getSecret(key: string) {
     if (secrets) {
       return secrets[key];
     }
     return process.env[key];
   }
   ```

5. **Update index.ts:**
   
   **File:** `backend/src/index.ts`
   ```typescript
   import { initializeSecrets } from './config/secrets.js';
   
   async function start() {
     await initializeSecrets();
     // ... rest of app initialization
   }
   
   start();
   ```

#### Verification:
- [ ] Secrets loaded from AWS in production
- [ ] .env still works in development
- [ ] No secrets in code or logs
- [ ] Application starts successfully

---

### 2.2 Add Input Sanitization

**Priority:** HIGH
**Time:** 30 minutes
**Downtime:** None

#### Steps:

1. **Install dependencies:**
   ```bash
   npm install isomorphic-dompurify
   ```

2. **Apply sanitization middleware:**
   
   **File:** `backend/src/index.ts`
   ```typescript
   import { 
     sanitizeInputs,
     preventPathTraversal,
     preventCommandInjection
   } from './middleware/sanitization.js';
   
   // Apply global sanitization
   app.use(sanitizeInputs);
   app.use(preventPathTraversal);
   app.use(preventCommandInjection);
   ```

3. **Apply specific sanitization:**
   
   **File:** `backend/src/modules/user/user.routes.ts`
   ```typescript
   import { sanitizeProfileUpdate } from '../../middleware/sanitization.js';
   
   router.put('/:userId', 
     authMiddleware,
     sanitizeProfileUpdate,  // ← ADD THIS
     UserController.updateProfile
   );
   ```
   
   **File:** `backend/src/modules/wallet/wallet.routes.ts`
   ```typescript
   import { sanitizePaymentInput } from '../../middleware/sanitization.js';
   
   router.post('/topup/initiate', 
     authMiddleware,
     sanitizePaymentInput,  // ← ADD THIS
     WalletController.initiateTopup
   );
   ```

#### Verification:
- [ ] XSS attempts are blocked
- [ ] SQL injection attempts are blocked
- [ ] Path traversal attempts are blocked
- [ ] Command injection attempts are blocked

---

### 2.3 Add Security Headers

**Priority:** HIGH
**Time:** 10 minutes
**Downtime:** None

#### Steps:

1. **Install helmet:**
   ```bash
   npm install helmet
   ```

2. **Configure helmet:**
   
   **File:** `backend/src/index.ts`
   ```typescript
   import helmet from 'helmet';
   
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         scriptSrc: ["'self'"],
         imgSrc: ["'self'", "data:", "https:"],
       },
     },
     hsts: {
       maxAge: 31536000,
       includeSubDomains: true,
       preload: true
     },
     noSniff: true,
     xssFilter: true,
     referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
   }));
   ```

#### Verification:
- [ ] Security headers present in responses
- [ ] CSP policy working
- [ ] HSTS enabled
- [ ] XSS filter enabled

---

### 2.4 Fix CORS Configuration

**Priority:** HIGH
**Time:** 5 minutes
**Downtime:** None

#### Steps:

1. **Update .env:**
   ```env
   # Development
   CORS_ORIGIN=http://localhost:3000
   
   # Production
   CORS_ORIGIN=https://krieta.com,https://www.krieta.com,https://app.krieta.com
   ```

2. **Update CORS middleware:**
   
   **File:** `backend/src/index.ts`
   ```typescript
   import cors from 'cors';
   
   app.use(cors({
     origin: env.CORS_ORIGIN.split(','),
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

#### Verification:
- [ ] Only allowed origins can access API
- [ ] Credentials work correctly
- [ ] Preflight requests work

---

## 🛡️ PHASE 3: MEDIUM PRIORITY FIXES (Week 2)

### 3.1 Add Comprehensive Audit Logging

**Priority:** MEDIUM
**Time:** 1 hour
**Downtime:** None

#### Steps:

1. **Create audit logging middleware:**
   
   **File:** `backend/src/middleware/auditLog.ts`
   ```typescript
   import { AuthRequest } from './auth.js';
   import { prisma } from '../config/database.js';
   
   export async function auditLog(
     action: string,
     targetType: string,
     targetId: string,
     req: AuthRequest,
     details?: any
   ) {
     await prisma.auditLog.create({
       data: {
         adminId: req.userId || 'system',
         action,
         targetType,
         targetId,
         details,
         ipAddress: req.ip,
         userAgent: req.headers['user-agent']
       }
     });
   }
   ```

2. **Add logging to sensitive operations:**
   
   **File:** `backend/src/modules/wallet/wallet.service.ts`
   ```typescript
   // After successful withdrawal
   await auditLog(
     'WITHDRAWAL_REQUESTED',
     'WITHDRAWAL',
     withdrawal.id,
     req,
     { amount: krAmount, provider }
   );
   ```

#### Verification:
- [ ] All sensitive operations logged
- [ ] Logs include IP and user agent
- [ ] Logs are searchable

---

### 3.2 Implement Idempotency Keys

**Priority:** MEDIUM
**Time:** 1 hour
**Downtime:** None

#### Steps:

1. **Create idempotency middleware:**
   
   **File:** `backend/src/middleware/idempotency.ts`
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { redis } from '../config/redis.js';
   
   export function requireIdempotencyKey(
     req: Request,
     res: Response,
     next: NextFunction
   ): void {
     const key = req.headers['idempotency-key'] as string;
     
     if (!key) {
       res.status(400).json({ 
         error: 'Idempotency-Key header required',
         code: 'IDEMPOTENCY_KEY_REQUIRED'
       });
       return;
     }
     
     req.body.idempotencyKey = key;
     next();
   }
   
   export async function checkIdempotency(
     key: string,
     userId: string
   ): Promise<any | null> {
     const cached = await redis.get(`idempotency:${userId}:${key}`);
     return cached ? JSON.parse(cached) : null;
   }
   
   export async function storeIdempotency(
     key: string,
     userId: string,
     result: any
   ): Promise<void> {
     await redis.setex(
       `idempotency:${userId}:${key}`,
       86400, // 24 hours
       JSON.stringify(result)
     );
   }
   ```

2. **Apply to payment endpoints:**
   
   **File:** `backend/src/modules/wallet/wallet.routes.ts`
   ```typescript
   import { requireIdempotencyKey } from '../../middleware/idempotency.js';
   
   router.post('/topup/initiate', 
     authMiddleware,
     requireIdempotencyKey,  // ← ADD THIS
     WalletController.initiateTopup
   );
   ```

#### Verification:
- [ ] Duplicate requests return cached response
- [ ] Idempotency keys expire after 24 hours
- [ ] Different users can use same key

---

## 📊 TESTING CHECKLIST

### Security Tests

- [ ] **RLS Tests**
  - [ ] Users can only access own data
  - [ ] Admins can access all data
  - [ ] Direct database queries respect RLS

- [ ] **Authorization Tests**
  - [ ] Users cannot access other users' profiles
  - [ ] Users cannot access other users' wallets
  - [ ] Users cannot modify other users' data

- [ ] **Rate Limiting Tests**
  - [ ] IP-based rate limiting works
  - [ ] User-based rate limiting works
  - [ ] Progressive delays work

- [ ] **Input Sanitization Tests**
  - [ ] XSS attempts blocked
  - [ ] SQL injection attempts blocked
  - [ ] Path traversal attempts blocked

- [ ] **Payment Security Tests**
  - [ ] Webhooks only accept whitelisted IPs
  - [ ] Amount tampering detected
  - [ ] Double-spending prevented

---

## 🚨 ROLLBACK PLAN

If issues occur:

1. **Disable RLS:**
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
   -- ... for all tables
   ```

2. **Remove middleware:**
   ```typescript
   // Comment out in index.ts
   // app.use(rlsMiddleware);
   // app.use(apiRateLimiter);
   ```

3. **Restore from backup:**
   ```bash
   pg_restore -d krieta_db backup.dump
   ```

---

## 📞 SUPPORT

For issues during implementation:
- Check logs: `tail -f logs/app.log`
- Check Redis: `redis-cli monitor`
- Check database: `psql $DATABASE_URL`

---

## ✅ POST-IMPLEMENTATION CHECKLIST

- [ ] All tests passing
- [ ] No errors in production logs
- [ ] Performance metrics normal
- [ ] Security scan passed
- [ ] Team trained on new security measures
- [ ] Documentation updated
- [ ] Monitoring alerts configured

---

**Remember:** Security is an ongoing process. Schedule regular security audits and keep all dependencies updated.
