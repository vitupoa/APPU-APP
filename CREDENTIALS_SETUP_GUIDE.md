# 🔐 Complete Credentials Setup Guide

## 📋 Current Status

Your `.env` file already has most credentials configured. Here's what you need to add:

### ✅ Already Configured
- Database (PostgreSQL)
- Redis
- JWT Secrets
- Cloudinary
- PayPal
- Paystack
- M-Pesa
- Exchange Rate API

### ⚠️ Missing Credentials
1. **Firebase (FCM)** - For push notifications
2. **AWS SES** - For email (currently placeholder)

---

## 🔥 Firebase Cloud Messaging (FCM) Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select existing project
3. Enter project name (e.g., "Runinga")
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Get Firebase Admin SDK Credentials

1. In Firebase Console, click **⚙️ Settings** → **Project settings**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** - This downloads a JSON file
5. Open the JSON file, you'll see:

```json
{
  "type": "service_account",
  "project_id": "runinga-xxxxx",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@runinga-xxxxx.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Step 3: Add to Railway Environment Variables

In Railway dashboard, add these 3 variables:

```env
FIREBASE_PROJECT_ID=runinga-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@runinga-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

**⚠️ IMPORTANT**: 
- Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters in the private key (they represent line breaks)
- In Railway, paste the private key as-is with the `\n` characters

### Step 4: Enable Firebase Cloud Messaging

1. In Firebase Console, go to **"Cloud Messaging"** in left sidebar
2. Click **"Get started"** if prompted
3. No additional configuration needed for backend

### Step 5: Get FCM Server Key (for mobile apps)

1. In Firebase Console → **Project settings** → **Cloud Messaging** tab
2. Under **"Cloud Messaging API (Legacy)"**, you'll see **"Server key"**
3. This is NOT needed for backend (we use Admin SDK)
4. But you'll need it for mobile app configuration

---

## 📱 Mobile App Firebase Configuration

### Android Setup

1. In Firebase Console → **Project settings** → **General** tab
2. Scroll to **"Your apps"** section
3. Click **Android icon** to add Android app
4. Enter package name: `com.runinga.com`
5. Download `google-services.json`
6. Place file in: `composeApp/src/androidMain/`

Add to `composeApp/build.gradle.kts`:
```kotlin
plugins {
    // ... existing plugins
    id("com.google.gms.google-services") version "4.4.0"
}

dependencies {
    // ... existing dependencies
    
    // Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")
}
```

Add to root `build.gradle.kts`:
```kotlin
buildscript {
    dependencies {
        classpath("com.google.gms:google-services:4.4.0")
    }
}
```

### iOS Setup

1. In Firebase Console → **Project settings** → **General** tab
2. Click **iOS icon** to add iOS app
3. Enter bundle ID: `com.runinga.com`
4. Download `GoogleService-Info.plist`
5. Place file in: `iosApp/iosApp/`
6. Add to Xcode project (drag & drop into Xcode)

Add to `iosApp/Podfile`:
```ruby
pod 'Firebase/Messaging'
```

---

## 📧 AWS SES (Email Service) Setup

### Step 1: Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign up or log in
3. Go to **SES (Simple Email Service)**

### Step 2: Verify Email Address

1. In SES Console, go to **"Verified identities"**
2. Click **"Create identity"**
3. Select **"Email address"**
4. Enter: `no-reply@runinga.com` (or your domain)
5. Click **"Create identity"**
6. Check email and click verification link

### Step 3: Create IAM User for SES

1. Go to **IAM** service in AWS Console
2. Click **"Users"** → **"Add users"**
3. Username: `runinga-ses-user`
4. Select **"Access key - Programmatic access"**
5. Click **"Next: Permissions"**
6. Click **"Attach existing policies directly"**
7. Search and select: **"AmazonSESFullAccess"**
8. Click **"Next"** → **"Create user"**
9. **SAVE** the credentials shown:
   - Access key ID
   - Secret access key

### Step 4: Add to Railway

```env
AWS_SES_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SES_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SES_REGION=us-east-1
EMAIL_FROM_ADDRESS=no-reply@runinga.com
```

### Step 5: Request Production Access (Optional)

By default, SES is in **sandbox mode** (can only send to verified emails).

To send to any email:
1. In SES Console, click **"Account dashboard"**
2. Click **"Request production access"**
3. Fill out the form explaining your use case
4. Wait for approval (usually 24 hours)

---

## 🚀 Railway Deployment - Complete Environment Variables

Here's the COMPLETE list of environment variables to add in Railway:

### 1. Firebase (NEW - Add these 3)
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
```

### 2. AWS SES (NEW - Add these 4)
```env
AWS_SES_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SES_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SES_REGION=us-east-1
EMAIL_FROM_ADDRESS=no-reply@runinga.com
```

### 3. Already Configured (Keep as-is)
```env
# Runtime
NODE_ENV=production
PORT=4000
CORS_ORIGIN=*

# Database
DATABASE_URL=postgresql://postgres:ovZPcTIfgdLrTLaMtZJEvjGpgHzRhPDn@maglev.proxy.rlwy.net:47013/railway

# Redis
REDIS_URL=redis://default:nrcKzyhJqBnzlbDJPiGgIMzwYCepPLjU@redis.railway.internal:6379

# JWT
JWT_ACCESS_SECRET=78ea4247aa9bb4d9c33725290283ea3ef893dda7bb4d6ccf8632d301db07e8dbad8233f61c06fd0b49ca39dac47f3a1d6142f6e449ec53d893e1387d693bcb4b
JWT_REFRESH_SECRET=8a5735f5599a60111664cd0cc5ad130e193f9b8f7cdc92ee12d5a46ad87ac4249d3fa60b8976462bddba70f9ac09c7cfc7d8e4cd128a632368f7dba3b70d2e28
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=dlfikd68s
CLOUDINARY_API_KEY=651974261387216
CLOUDINARY_API_SECRET=fNvOpSCgTqBnq5VIRVssVrTs6Ts
CLOUDINARY_UPLOAD_PRESET=Runinga

# Request Signing
REQUEST_SIGNING_KEY=7cb03cbeee0854dcbfd2bf492b37b38d91a2d2b99d7da602770ce8e8679c7543fc302546a05bb2cbf1e187730b23d7651957fd66bd514bb54077810cbbcc89a3

# PayPal
PAYPAL_CLIENT_ID=AZQ9S028sVatetTKv9qPpfhuimYVc_av0E91NnV5xWsNugUcO_o0NLBtaPrk1eYXUTXeM0Q_zwu5BjQn
PAYPAL_CLIENT_SECRET=ELfPub-Fj2mCdf5iJeHzI6LQLsNI9M2GinU4wdePuq0lRYOWyidhgJ9MBwSD5MF8X95NE6MC_peNNHcx
PAYPAL_MODE=sandbox
PAYPAL_TOPUP_ENABLED=true
PAYPAL_WITHDRAWAL_ENABLED=false
PAYPAL_SUPPORTED_COUNTRIES=US,GB,CA,AU,DE,FR

# Paystack
PAYSTACK_SECRET_KEY=sk_test_c97a0735f72d63eb91ef96f68714c9da5c59655d
PAYSTACK_PUBLIC_KEY=pk_test_6ce561e5c107ec0cb47149044515bca0ed606d9f
PAYSTACK_ENVIRONMENT=test
PAYSTACK_TRANSFER_ENABLED=true

# M-Pesa
MPESA_CONSUMER_KEY=GZdCKbc9W7Lmo97s8I8l4o2NhBvehoyxmfGwuOPu4pFml7Wn
MPESA_CONSUMER_SECRET=905eOELscgDkfIWxyAaN2HL2snpFOWIlFGFPpmJ6Zop5OzFpSayv2cKsbywnGcJC
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=https://appu-app-production.up.railway.app/webhooks/mpesa

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Rc Coin
RC_TO_USD_RATE=0.01
RC_PRECISION=1000000

# Fees
FEES_ENABLED=false
FEE_TIP_BASIS_POINTS=1500
FEE_SHOP_BASIS_POINTS=200
FEE_TOPUP_BASIS_POINTS=200
FEE_WITHDRAWAL_BASIS_POINTS=300
FEE_MIN_RC_MIKR=1000000

# Limits
LIMIT_BASIC_TOPUP_DAILY=50
LIMIT_BASIC_WITHDRAW_DAILY=30
LIMIT_VERIFIED_TOPUP_DAILY=200
LIMIT_VERIFIED_WITHDRAW_DAILY=100
LIMIT_PREMIUM_TOPUP_DAILY=1000
LIMIT_PREMIUM_WITHDRAW_DAILY=500
LIMIT_BUSINESS_TOPUP_DAILY=5000
LIMIT_BUSINESS_WITHDRAW_DAILY=3000
LIMIT_MIN_WITHDRAWAL_KR=10
LIMIT_MIN_TOPUP_KR=1

# Minimum topup per country
MIN_TOPUP_KES=50
MIN_TOPUP_NGN=500
MIN_TOPUP_GHS=2
MIN_TOPUP_USD=1

# Exchange Rate API
EXCHANGE_RATE_BASE_URL=https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies
```

---

## 📝 Quick Setup Checklist

### Backend (Railway)
- [ ] Add FIREBASE_PROJECT_ID
- [ ] Add FIREBASE_CLIENT_EMAIL
- [ ] Add FIREBASE_PRIVATE_KEY
- [ ] Add AWS_SES_ACCESS_KEY_ID
- [ ] Add AWS_SES_SECRET_ACCESS_KEY
- [ ] Add AWS_SES_REGION
- [ ] Add EMAIL_FROM_ADDRESS
- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Install dependencies: `npm install` (adds firebase-admin)
- [ ] Restart Railway service

### Mobile App (Android)
- [ ] Add Android app in Firebase Console
- [ ] Download google-services.json
- [ ] Place in composeApp/src/androidMain/
- [ ] Add Firebase dependencies to build.gradle.kts
- [ ] Add google-services plugin

### Mobile App (iOS)
- [ ] Add iOS app in Firebase Console
- [ ] Download GoogleService-Info.plist
- [ ] Place in iosApp/iosApp/
- [ ] Add to Xcode project
- [ ] Add Firebase pod to Podfile

---

## 🔍 Testing FCM

### Test Device Token Registration

```bash
curl -X POST https://your-railway-url.railway.app/api/v1/notifications/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "deviceToken": "test-fcm-token-123",
    "platform": "android"
  }'
```

### Test Push Notification (Manual)

Create a test script `test-fcm.js`:

```javascript
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'your-project-id',
    clientEmail: 'your-client-email',
    privateKey: 'your-private-key'.replace(/\\n/g, '\n'),
  }),
});

const message = {
  token: 'device-token-here',
  notification: {
    title: 'Test Notification',
    body: 'This is a test from Runinga!',
  },
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
```

Run: `node test-fcm.js`

---

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid private key"
**Solution**: Make sure you copied the ENTIRE private key including:
- `-----BEGIN PRIVATE KEY-----`
- All the key content
- `-----END PRIVATE KEY-----`
- Keep the `\n` characters

### Issue 2: "Permission denied"
**Solution**: Make sure the service account has the correct permissions in Firebase Console

### Issue 3: "App not registered"
**Solution**: Make sure you added the Android/iOS app in Firebase Console with correct package name/bundle ID

### Issue 4: "Token not registered"
**Solution**: Device token must be registered via `/api/v1/notifications/register-token` endpoint first

---

## 📚 Additional Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [FCM Server Setup](https://firebase.google.com/docs/cloud-messaging/server)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

---

## ✅ Summary

**What you need to do:**

1. **Create Firebase project** → Get 3 credentials (project_id, client_email, private_key)
2. **Add to Railway** → Add 3 Firebase env variables
3. **Optional: Setup AWS SES** → Get 2 credentials (access_key, secret_key)
4. **Optional: Add to Railway** → Add 4 AWS SES env variables
5. **Mobile apps** → Download config files (google-services.json, GoogleService-Info.plist)
6. **Deploy** → Restart Railway service

**Total new credentials needed:**
- Firebase: 3 variables (REQUIRED for push notifications)
- AWS SES: 4 variables (OPTIONAL for emails, currently has placeholders)

All other credentials are already configured in your `.env` file! 🎉
