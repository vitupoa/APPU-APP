# Railway Environment Variables - Quick Setup

## 🚀 Copy-Paste Ready Commands

### 1. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it for `FIELD_ENCRYPTION_KEY`

---

## 📋 Required Environment Variables

### CORS Configuration
```bash
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```
⚠️ **Important**: 
- Use comma-separated list (NO SPACES)
- Include all your frontend domains
- Example: `https://krieta.com,https://app.krieta.com,https://admin.krieta.com`

---

### Field Encryption
```bash
FIELD_ENCRYPTION_KEY=<paste_64_character_hex_from_step_1>
```
⚠️ **Important**: 
- Must be exactly 64 hexadecimal characters
- Generate using the command above
- Never share or commit this key

---

### Firebase/FCM Credentials

#### Step 1: Download JSON
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Settings ⚙️ → Service Accounts
4. Generate New Private Key
5. Download JSON file

#### Step 2: Extract Values
Open the downloaded JSON and copy these values:

```bash
FIREBASE_PROJECT_ID=<copy_from_json_project_id>
```
Example: `krieta-app`

```bash
FIREBASE_CLIENT_EMAIL=<copy_from_json_client_email>
```
Example: `firebase-adminsdk-xxxxx@krieta-app.iam.gserviceaccount.com`

```bash
FIREBASE_PRIVATE_KEY=<copy_entire_private_key_including_BEGIN_END_lines>
```
Example: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n`

⚠️ **Important**: 
- Keep `\n` as literal characters (not actual newlines)
- Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- No extra spaces before or after

---

### Payment Provider Secrets

#### M-Pesa
```bash
MPESA_CONSUMER_SECRET=<your_mpesa_consumer_secret>
```
Get from: [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)

#### Paystack
```bash
PAYSTACK_SECRET_KEY=sk_live_<your_paystack_secret>
```
Get from: [Paystack Dashboard](https://dashboard.paystack.com/) → Settings → API Keys & Webhooks

#### PayPal
```bash
PAYPAL_CLIENT_SECRET=<your_paypal_client_secret>
```
Get from: [PayPal Developer Dashboard](https://developer.paypal.com/) → My Apps & Credentials

---

## 🎯 Railway Setup Methods

### Method 1: Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/)
2. Select your project
3. Click on your backend service
4. Go to **Variables** tab
5. Click **+ New Variable**
6. Add each variable one by one

### Method 2: Railway CLI

```bash
# Install Railway CLI if not installed
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set variables
railway variables set CORS_ORIGIN="https://yourdomain.com,https://app.yourdomain.com"
railway variables set FIELD_ENCRYPTION_KEY="<your_64_char_hex>"
railway variables set FIREBASE_PROJECT_ID="your-project-id"
railway variables set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
railway variables set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
railway variables set MPESA_CONSUMER_SECRET="your_secret"
railway variables set PAYSTACK_SECRET_KEY="sk_live_xxxxx"
railway variables set PAYPAL_CLIENT_SECRET="your_secret"
```

---

## ✅ Verification Checklist

After adding all variables:

- [ ] `CORS_ORIGIN` - Comma-separated, no spaces
- [ ] `FIELD_ENCRYPTION_KEY` - 64 hex characters
- [ ] `FIREBASE_PROJECT_ID` - Matches Firebase project
- [ ] `FIREBASE_CLIENT_EMAIL` - Ends with `.iam.gserviceaccount.com`
- [ ] `FIREBASE_PRIVATE_KEY` - Includes BEGIN/END lines, `\n` as literal
- [ ] `MPESA_CONSUMER_SECRET` - From Daraja portal
- [ ] `PAYSTACK_SECRET_KEY` - Starts with `sk_live_` or `sk_test_`
- [ ] `PAYPAL_CLIENT_SECRET` - From PayPal developer dashboard

---

## 🧪 Test After Deployment

### 1. Check Logs
```bash
railway logs
```

Look for:
- ✅ `[FCM] Firebase Admin SDK initialized successfully`
- ✅ `Server running on port 3000`
- ❌ No errors about missing environment variables

### 2. Test CORS
```bash
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-api.railway.app/api/v1/auth/login
```

Should return CORS headers.

### 3. Test Encryption
```bash
# Create a test endpoint that uses encryption
curl -X POST https://your-api.railway.app/api/v1/test/encryption \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"data":"test"}'
```

---

## 🔧 Troubleshooting

### Error: "CORS origin not allowed"
- Check `CORS_ORIGIN` has no spaces
- Verify your frontend domain is included
- Make sure it starts with `https://` (or `http://` for local)

### Error: "Invalid encryption key"
- Verify key is exactly 64 hexadecimal characters
- Regenerate using the command above
- No quotes or spaces around the key

### Error: "Firebase initialization failed"
- Check all 3 Firebase variables are set
- Verify `\n` in private key are literal (not actual newlines)
- Ensure BEGIN/END lines are included
- No extra spaces in any Firebase variable

### Error: "Webhook signature verification failed"
- Verify payment provider secrets are correct
- Check they match your provider dashboard
- For Paystack, use secret key (not public key)

---

## 📞 Quick Help

### Generate New Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### View Current Railway Variables
```bash
railway variables
```

### Delete a Variable
```bash
railway variables delete VARIABLE_NAME
```

### Restart Service After Adding Variables
```bash
railway up
```

---

## 🎯 Complete Setup Script

Copy and run this after replacing placeholders:

```bash
#!/bin/bash

# Generate encryption key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set all variables
railway variables set CORS_ORIGIN="https://yourdomain.com,https://app.yourdomain.com"
railway variables set FIELD_ENCRYPTION_KEY="$ENCRYPTION_KEY"
railway variables set FIREBASE_PROJECT_ID="your-project-id"
railway variables set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
railway variables set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
railway variables set MPESA_CONSUMER_SECRET="your_mpesa_secret"
railway variables set PAYSTACK_SECRET_KEY="sk_live_xxxxx"
railway variables set PAYPAL_CLIENT_SECRET="your_paypal_secret"

echo "✅ All variables set!"
echo "🔑 Encryption key: $ENCRYPTION_KEY"
echo "⚠️  Save this key securely!"
```

---

**Last Updated**: December 2024  
**Status**: ✅ READY TO USE
