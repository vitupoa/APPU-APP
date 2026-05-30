# SECURITY MIDDLEWARE INTEGRATION GUIDE

## Files to Update

### 1. Webhook Routes (`backend/src/routes/webhook.routes.ts`)

```typescript
import { Router } from 'express';
import { webhookSecurity } from '../middleware/webhookSecurity.js';
import { paystackWebhookHandler, mpesaWebhookHandler, paypalWebhookHandler } from '../controllers/webhook.controller.js';

const router = Router();

// Add IP whitelisting + signature verification
router.post('/paystack', webhookSecurity('paystack'), paystackWebhookHandler);
router.post('/mpesa', webhookSecurity('mpesa'), mpesaWebhookHandler);
router.post('/paypal', webhookSecurity('paypal'), paypalWebhookHandler);

export default router;
```

---

### 2. Wallet Routes (`backend/src/modules/wallet/wallet.routes.ts`)

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { idempotencyMiddleware } from '../../middleware/idempotency.js';
import { validateWalletOwnership } from '../../middleware/ownership.js';
import * as walletController from './wallet.controller.js';

const router = Router();

// All wallet routes require authentication + ownership validation
router.use(authMiddleware, validateWalletOwnership);

// Financial operations require idempotency
router.get('/balance', walletController.getBalance);
router.post('/tip', idempotencyMiddleware(), walletController.tipUser);
router.post('/withdraw', idempotencyMiddleware(), walletController.withdraw);
router.post('/transfer', idempotencyMiddleware(), walletController.transfer);
router.get('/transactions', walletController.getTransactions);

export default router;
```

---

### 3. User Routes (`backend/src/modules/user/user.routes.ts`)

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validateProfileOwnership, preventSensitiveFieldModification } from '../../middleware/ownership.js';
import * as userController from './user.service.js';

const router = Router();

// Profile routes with ownership validation
router.get('/me', authMiddleware, userController.getCurrentUser);
router.get('/:userId', authMiddleware, validateProfileOwnership, userController.getUser);
router.put('/:userId', authMiddleware, validateProfileOwnership, preventSensitiveFieldModification, userController.updateUser);
router.delete('/:userId', authMiddleware, validateProfileOwnership, userController.deleteUser);

export default router;
```

---

### 4. KYC/Withdrawal Routes (`backend/src/modules/kyc/kyc.routes.ts`)

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { idempotencyMiddleware } from '../../middleware/idempotency.js';
import { validateWithdrawalOwnership } from '../../middleware/ownership.js';
import * as kycController from './kyc.service.js';

const router = Router();

// Withdrawal routes with idempotency + ownership
router.post('/withdrawal', authMiddleware, idempotencyMiddleware(), kycController.createWithdrawal);
router.get('/withdrawal/:requestId', authMiddleware, validateWithdrawalOwnership, kycController.getWithdrawal);
router.get('/withdrawals', authMiddleware, kycController.getWithdrawals);

// KYC routes
router.post('/documents', authMiddleware, kycController.uploadKYCDocuments);
router.get('/documents', authMiddleware, kycController.getKYCDocuments);

export default router;
```

---

### 5. Transaction Routes (Add to wallet or create separate)

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validateTransactionOwnership } from '../../middleware/ownership.js';
import * as transactionController from './transaction.controller.js';

const router = Router();

// Transaction routes with ownership validation
router.get('/:transactionId', authMiddleware, validateTransactionOwnership, transactionController.getTransaction);
router.get('/', authMiddleware, transactionController.getTransactions);

export default router;
```

---

### 6. Chama Routes (`backend/src/modules/chama/chama.routes.ts`)

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validateChamaMembership } from '../../middleware/ownership.js';
import { idempotencyMiddleware } from '../../middleware/idempotency.js';
import * as chamaController from './chama.controller.js';

const router = Router();

// Chama routes with membership validation
router.get('/:chamaId', authMiddleware, validateChamaMembership, chamaController.getChama);
router.get('/:chamaId/members', authMiddleware, validateChamaMembership, chamaController.getMembers);

// Financial operations require idempotency
router.post('/:chamaId/contribute', authMiddleware, validateChamaMembership, idempotencyMiddleware(), chamaController.contribute);
router.post('/:chamaId/payout', authMiddleware, validateChamaMembership, idempotencyMiddleware(), chamaController.createPayout);

export default router;
```

---

### 7. Content Routes (Shorts/Posts)

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validateContentOwnership } from '../../middleware/ownership.js';
import * as shortsController from './shorts.controller.js';

const router = Router();

// Content modification requires ownership
router.put('/:shortId', authMiddleware, validateContentOwnership, shortsController.updateShort);
router.delete('/:shortId', authMiddleware, validateContentOwnership, shortsController.deleteShort);

export default router;
```

---

## Quick Integration Checklist

For each route file:

1. **Import middleware**:
```typescript
import { idempotencyMiddleware } from '../../middleware/idempotency.js';
import { validateWalletOwnership, validateProfileOwnership, etc } from '../../middleware/ownership.js';
```

2. **Add to financial routes**:
```typescript
router.post('/financial-operation', authMiddleware, idempotencyMiddleware(), handler);
```

3. **Add to resource routes**:
```typescript
router.get('/resource/:id', authMiddleware, validateResourceOwnership, handler);
```

4. **Add to webhook routes**:
```typescript
router.post('/webhook/provider', webhookSecurity('provider'), handler);
```

---

## Testing After Integration

```bash
# Test idempotency
curl -X POST http://localhost:3000/api/v1/wallet/tip \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: test-123" \
  -H "Content-Type: application/json" \
  -d '{"recipientId": "...", "amount": 100}'

# Send again - should return same response
curl -X POST http://localhost:3000/api/v1/wallet/tip \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: test-123" \
  -H "Content-Type: application/json" \
  -d '{"recipientId": "...", "amount": 100}'

# Test ownership validation (should fail)
curl -X GET http://localhost:3000/api/v1/users/<other-user-id> \
  -H "Authorization: Bearer <your-token>"
```

---

## Notes

- All middleware is already created and ready to use
- Just import and add to routes as shown above
- Test each route after integration
- Monitor audit logs for any issues
