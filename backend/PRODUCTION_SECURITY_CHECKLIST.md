# Production Deployment Security Checklist

## 🚨 CRITICAL: Before Going Live

### 1. Environment Variables (Railway Dashboard)

```bash
# ✅ Set NODE_ENV to production
NODE_ENV=production

# ✅ Set CORS_ORIGIN to your actual domains (NEVER use *)
CORS_ORIGIN=https://krieta.com,https://www.krieta.com,https://app.krieta.com

# ✅ Generate strong secrets (use: openssl rand -base64 32)
REQUEST_SIGNING_KEY=<32+ character random string>
ENCRYPTION_KEY=<32+ character random string>
JWT_ACCESS_SECRET=<32+ character random string>
JWT_REFRESH_SECRET=<32+ character random string>
```

### 2. Database Security

```bash
# ✅ Run RLS migration (one-time)
npm run migrate:rls

# ✅ Verify RLS is enabled
# Check Railway logs for: "RLS policies created successfully"
```

### 3. Payment Provider Setup

#### PayPal
```bash
# ✅ Switch to live mode
PAYPAL_MODE=live

# ✅ Set production credentials
PAYPAL_CLIENT_ID=<live-client-id>
PAYPAL_CLIENT_SECRET=<live-client-secret>

# ✅ Configure webhook in PayPal dashboard
# URL: https://api.krieta.com/api/v1/webhooks/paypal
# Events: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED
```

#### Paystack
```bash
# ✅ Set production credentials
PAYSTACK_SECRET_KEY=sk_live_<your-key>
PAYSTACK_PUBLIC_KEY=pk_live_<your-key>

# ✅ Configure webhook in Paystack dashboard
# URL: https://api.krieta.com/api/v1/webhooks/paystack
```

#### M-Pesa
```bash
# ✅ Switch to production
MPESA_ENV=production

# ✅ Set production credentials
MPESA_CONSUMER_KEY=<production-key>
MPESA_CONSUMER_SECRET=<production-secret>
MPESA_SHORTCODE=<production-shortcode>
MPESA_PASSKEY=<production-passkey>

# ✅ Set callback URL
MPESA_CALLBACK_URL=https://api.krieta.com/api/v1/webhooks/mpesa

# ✅ Whitelist Railway IP in Safaricom portal
# Get Railway IP: curl https://api.krieta.com/health
```

### 4. Security Headers

✅ Already configured in `src/config/security.ts`
- No action needed, automatically applied

### 5. Rate Limiting

✅ Already configured
- Adjust if needed:
```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

### 6. HTTPS/SSL

✅ Railway provides automatic HTTPS
- No action needed

### 7. Monitoring

```bash
# ✅ Check Railway logs regularly
# Look for:
# - Rate limit violations
# - Failed authentication attempts
# - Webhook failures
# - Database errors
```

---

## 🔒 Security Verification

### Test 1: CORS Protection
```bash
# Should FAIL from unauthorized origin
curl -H "Origin: https://evil.com" \
  https://api.krieta.com/api/v1/health

# Should SUCCEED from authorized origin
curl -H "Origin: https://krieta.com" \
  https://api.krieta.com/api/v1/health
```

### Test 2: Rate Limiting
```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl https://api.krieta.com/api/v1/health
done
# Should get 429 after 100 requests
```

### Test 3: Input Sanitization
```bash
# Try XSS attack
curl -X POST https://api.krieta.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "<script>alert(1)</script>"}'
# Should be rejected or sanitized
```

### Test 4: Webhook Security
```bash
# Try webhook without signature
curl -X POST https://api.krieta.com/api/v1/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{"event_type": "PAYMENT.CAPTURE.COMPLETED"}'
# Should be rejected (401 Unauthorized)
```

---

## 🚫 Common Mistakes to Avoid

### ❌ DON'T
1. Use `CORS_ORIGIN=*` in production
2. Commit `.env` file to git
3. Share secrets in chat/email
4. Use weak JWT secrets
5. Skip RLS migration
6. Use sandbox mode in production
7. Hardcode credentials in code
8. Expose sensitive data in API responses

### ✅ DO
1. Use specific CORS origins
2. Use Railway environment variables
3. Generate strong random secrets
4. Rotate secrets periodically
5. Monitor logs regularly
6. Test security before launch
7. Keep dependencies updated
8. Use HTTPS everywhere

---

## 📋 Pre-Launch Checklist

- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN set to actual domains (no *)
- [ ] All secrets generated (32+ characters)
- [ ] RLS migration completed
- [ ] PayPal in live mode
- [ ] Paystack production keys
- [ ] M-Pesa production credentials
- [ ] M-Pesa IP whitelisted
- [ ] All webhooks configured
- [ ] Security tests passed
- [ ] Logs monitored
- [ ] Team trained on security

---

## 🆘 Emergency Procedures

### If secrets are compromised:
1. Immediately rotate in Railway dashboard
2. Invalidate all JWT tokens (restart service)
3. Review logs for suspicious activity
4. Notify affected users if needed

### If rate limit is too strict:
```bash
# Increase in Railway dashboard
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW_MS=900000
```

### If CORS blocks legitimate requests:
```bash
# Add domain to CORS_ORIGIN
CORS_ORIGIN=https://krieta.com,https://new-domain.com
```

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Security Issues: Check SECURITY_COMPLETE.md
- Payment Issues: Check provider documentation

---

**You're ready to deploy! 🚀**
