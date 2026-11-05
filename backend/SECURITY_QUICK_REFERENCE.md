# Security Quick Reference Card 🛡️

## 🚀 Quick Start

### Development
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Generate secrets (run these commands)
openssl rand -base64 32  # For JWT_ACCESS_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 16  # For REQUEST_SIGNING_KEY

# 3. Update .env with your values

# 4. Run migrations
npm run migrate:rls

# 5. Start server
npm run dev
```

### Production (Railway)
```bash
# 1. Set environment variables in Railway dashboard
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# 2. Deploy
git push

# 3. Railway automatically runs:
npm run migrate:rls && npm run start
```

---

## 🔒 Security Features at a Glance

| Feature | Status | File | Purpose |
|---------|--------|------|---------|
| **Input Sanitization** | ✅ | `src/middleware/sanitization.ts` | Prevents XSS, SQL injection, command injection |
| **Security Headers** | ✅ | `src/config/security.ts` | Prevents clickjacking, MIME sniffing, XSS |
| **CORS** | ✅ | `src/config/security.ts` | Controls which domains can access API |
| **Rate Limiting** | ✅ | `src/middleware/rateLimiter.ts` | Prevents brute force, DDoS |
| **RLS** | ✅ | `src/middleware/rls.ts` | Database-level access control |
| **Ownership** | ✅ | `src/middleware/ownership.ts` | Ensures users only modify their data |
| **Webhook Security** | ✅ | `src/controllers/webhook.controller.ts` | Verifies payment webhooks |
| **JWT Auth** | ✅ | `src/middleware/auth.ts` | Secure authentication |

---

## 🎯 Common Tasks

### Add a New Route
```typescript
// 1. Create route file
// src/modules/mymodule/mymodule.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { ownershipMiddleware } from '../../middleware/ownership.js';
import { sanitizeInputs } from '../../middleware/sanitization.js';

const router = Router();

// Public route (no auth)
router.get('/public', (req, res) => {
  res.json({ message: 'Public data' });
});

// Protected route (auth required)
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected data', userId: req.user.id });
});

// Ownership-protected route
router.put('/:id', 
  authMiddleware, 
  ownershipMiddleware('MyModel'), 
  sanitizeInputs,
  (req, res) => {
    // User can only update their own resource
  }
);

export default router;

// 2. Register in src/index.ts
app.use('/api/v1/mymodule', myModuleRoutes);
```

### Add Input Validation
```typescript
import { z } from 'zod';
import { validateSchema } from '../../middleware/sanitization.js';

// Define schema
const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).max(10).optional(),
});

// Use in route
router.post('/posts', 
  authMiddleware,
  validateSchema(createPostSchema),
  async (req, res) => {
    // req.body is now validated and typed
  }
);
```

### Add Rate Limiting to Specific Route
```typescript
import rateLimit from 'express-rate-limit';

// Create custom limiter
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many requests, please try again later',
});

// Apply to route
router.post('/sensitive-action', 
  strictLimiter,
  authMiddleware,
  async (req, res) => {
    // Strictly rate-limited action
  }
);
```

---

## 🔍 Debugging Security Issues

### CORS Error
```
Error: "Access to fetch at 'https://api.runinga.com' from origin 
'https://myapp.com' has been blocked by CORS policy"

Solution:
1. Add origin to CORS_ORIGIN in Railway:
   CORS_ORIGIN=https://runinga.com,https://myapp.com
2. Restart service
```

### Rate Limit Hit
```
Error: 429 Too Many Requests

Solution:
1. Check if legitimate traffic
2. Increase limit in Railway:
   RATE_LIMIT_MAX=200
3. Or implement user-specific limits
```

### Webhook Signature Failed
```
Error: 401 Unauthorized (webhook)

Solution:
1. Verify webhook secret matches provider
2. Check IP whitelist (M-Pesa)
3. Review webhook logs in Railway
```

### RLS Blocking Query
```
Error: "new row violates row-level security policy"

Solution:
1. Ensure user is authenticated
2. Check RLS middleware is applied
3. Verify user owns the resource
4. Review RLS policies in database
```

---

## 📊 Monitoring

### Check Logs (Railway)
```bash
# View live logs
railway logs

# Filter by error
railway logs | grep ERROR

# Filter by rate limit
railway logs | grep "429"
```

### Key Metrics to Monitor
- Rate limit violations (429 responses)
- Failed authentication (401 responses)
- Unauthorized access (403 responses)
- Webhook failures (check payment logs)
- Slow queries (>1000ms logged automatically)

---

## 🚨 Security Incidents

### If Secrets Compromised
```bash
# 1. Generate new secrets
openssl rand -base64 32

# 2. Update in Railway dashboard immediately

# 3. Restart service (invalidates all JWTs)

# 4. Review logs for suspicious activity

# 5. Notify affected users if needed
```

### If Suspicious Activity Detected
```bash
# 1. Check Railway logs
railway logs | grep <suspicious-ip>

# 2. Temporarily block IP (add to rate limiter)

# 3. Review affected user accounts

# 4. Reset passwords if needed

# 5. Document incident
```

---

## 🧪 Testing

### Test Security Locally
```bash
# Test XSS protection
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "<script>alert(1)</script>"}'

# Test rate limiting
for i in {1..101}; do curl http://localhost:3000/api/v1/health; done

# Test authentication
curl http://localhost:3000/api/v1/users/me
# Should return 401

# Test CORS
curl -H "Origin: https://evil.com" http://localhost:3000/api/v1/health
```

### Test in Production
```bash
# Test HTTPS
curl -I https://api.runinga.com/health
# Should see: Strict-Transport-Security header

# Test CORS
curl -H "Origin: https://runinga.com" https://api.runinga.com/api/v1/health
# Should succeed

curl -H "Origin: https://evil.com" https://api.runinga.com/api/v1/health
# Should fail

# Test security headers
curl -I https://api.runinga.com/api/v1/health
# Should see: X-Frame-Options, X-Content-Type-Options, etc.
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SECURITY_COMPLETE.md` | Comprehensive security guide |
| `PRODUCTION_SECURITY_CHECKLIST.md` | Pre-launch checklist |
| `SECURITY_IMPLEMENTATION_SUMMARY.md` | What was implemented |
| `SECURITY_FLOW_DIAGRAM.md` | Visual security flow |
| `SECURITY_QUICK_REFERENCE.md` | This file |

---

## 🔗 Useful Commands

```bash
# Generate secret
openssl rand -base64 32

# Check Railway logs
railway logs

# Deploy to Railway
git push

# Run migrations
npm run migrate:rls

# Test locally
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## ⚡ Quick Fixes

### "CORS error in production"
```bash
# Railway dashboard → Variables
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### "Rate limit too strict"
```bash
# Railway dashboard → Variables
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW_MS=900000
```

### "Webhook not working"
```bash
# 1. Check webhook URL in provider dashboard
# 2. Verify secret matches
# 3. Check Railway logs for errors
# 4. Test with provider's webhook tester
```

### "RLS blocking queries"
```bash
# 1. Verify user is authenticated
# 2. Check RLS middleware is applied
# 3. Review database policies
```

---

## 🎓 Best Practices

### ✅ DO
- Use Railway environment variables for secrets
- Generate strong random secrets (32+ characters)
- Set specific CORS origins in production
- Monitor logs regularly
- Test security before deploying
- Keep dependencies updated
- Use HTTPS everywhere
- Validate all inputs
- Filter sensitive data from responses

### ❌ DON'T
- Commit .env file to git
- Use CORS_ORIGIN=* in production
- Hardcode credentials in code
- Share secrets in chat/email
- Skip input validation
- Trust frontend data
- Expose sensitive data in API
- Use weak secrets

---

## 🆘 Need Help?

1. Check documentation files (listed above)
2. Review Railway logs
3. Test locally first
4. Check provider documentation (PayPal, Paystack, M-Pesa)
5. Review security flow diagram

---

**Keep this file handy for quick reference! 📌**
