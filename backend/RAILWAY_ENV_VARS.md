# Railway Environment Variables Setup Guide

## ⚠️ CRITICAL - Required Variables

Set these in Railway Dashboard → Your Service → Variables:

### Core Application
```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

### Security (Generate secure random strings)
```
REQUEST_SIGNING_KEY=<generate-32-char-random-string>
ENCRYPTION_KEY=<generate-64-char-random-string>
JWT_ACCESS_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Database (Railway will auto-provide)
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Redis (Railway will auto-provide if you add Redis service)
```
REDIS_URL=${{Redis.REDIS_URL}}
```

### Cloudinary (Get from cloudinary.com)
```
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
CLOUDINARY_UPLOAD_PRESET=<optional-preset-name>
```

### Rate Limiting
```
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

## 📱 Optional - Payment Providers

### PayPal (Get from developer.paypal.com)
```
PAYPAL_CLIENT_ID=<your-client-id>
PAYPAL_CLIENT_SECRET=<your-client-secret>
PAYPAL_MODE=sandbox
```

### Paystack (Get from paystack.com)
```
PAYSTACK_SECRET_KEY=<your-secret-key>
PAYSTACK_PUBLIC_KEY=<your-public-key>
```

### M-Pesa / Daraja (Get from developer.safaricom.co.ke)
```
MPESA_CONSUMER_KEY=<your-consumer-key>
MPESA_CONSUMER_SECRET=<your-consumer-secret>
MPESA_SHORTCODE=<your-shortcode>
MPESA_PASSKEY=<your-passkey>
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=https://your-domain.railway.app/api/payments/mpesa/callback
MPESA_INITIATOR_NAME=<your-initiator-name>
MPESA_INITIATOR_PASSWORD=<your-initiator-password>
```

### Payoneer (Get from payoneer.com)
```
PAYONEER_PARTNER_ID=<your-partner-id>
PAYONEER_API_TOKEN=<your-api-token>
```

## 🔗 Optional - OAuth Providers

### Instagram (Get from developers.facebook.com)
```
INSTAGRAM_CLIENT_ID=<your-client-id>
INSTAGRAM_CLIENT_SECRET=<your-client-secret>
```

### TikTok (Get from developers.tiktok.com)
```
TIKTOK_CLIENT_KEY=<your-client-key>
TIKTOK_CLIENT_SECRET=<your-client-secret>
```

### YouTube (Get from console.cloud.google.com)
```
YOUTUBE_CLIENT_ID=<your-client-id>
YOUTUBE_CLIENT_SECRET=<your-client-secret>
```

## 🔧 How to Generate Secure Random Strings

### Using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL:
```bash
openssl rand -hex 32
```

### Using PowerShell (Windows):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

## 📝 Notes

1. **Never commit these values to Git** - They are secrets!
2. **Use Railway's built-in variable references** for database and Redis URLs
3. **Start with required variables only** - Add payment/OAuth providers as needed
4. **Use sandbox/test modes** for payment providers during development
5. **Update callback URLs** to match your Railway domain after deployment

## 🚀 Quick Start (Minimum Required)

For initial deployment, you only need:
- REQUEST_SIGNING_KEY
- ENCRYPTION_KEY
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- CLOUDINARY credentials
- DATABASE_URL (auto-provided by Railway)
- REDIS_URL (auto-provided by Railway)

Payment and OAuth providers can be added later as you integrate those features.
