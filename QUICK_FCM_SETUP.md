# 🚀 Quick FCM Setup - 5 Minutes

## Step 1: Get Firebase Credentials (3 minutes)

1. Go to https://console.firebase.google.com/
2. Create/select project
3. Click ⚙️ Settings → Project settings → Service accounts
4. Click "Generate new private key" → Download JSON
5. Open JSON file and copy these 3 values:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 2: Add to Railway (2 minutes)

Go to Railway dashboard → Your project → Variables tab

Add these 3 variables:

```
FIREBASE_PROJECT_ID = [paste project_id from JSON]
FIREBASE_CLIENT_EMAIL = [paste client_email from JSON]
FIREBASE_PRIVATE_KEY = [paste entire private_key including -----BEGIN and -----END]
```

**IMPORTANT**: Keep the `\n` characters in the private key!

## Step 3: Restart Railway

Click "Deploy" or wait for auto-deploy.

## ✅ Done!

Your push notifications are now configured!

---

## 📱 Mobile App Setup (Optional - for later)

### Android
1. Firebase Console → Add Android app
2. Package name: `com.krieta.com`
3. Download `google-services.json`
4. Place in `composeApp/src/androidMain/`

### iOS
1. Firebase Console → Add iOS app
2. Bundle ID: `com.krieta.com`
3. Download `GoogleService-Info.plist`
4. Place in `iosApp/iosApp/`

---

## 🧪 Test It

After deployment, test device registration:

```bash
curl -X POST https://your-app.railway.app/api/v1/notifications/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"deviceToken": "test-token", "platform": "android"}'
```

Should return: `{"success": true, "message": "Device token registered successfully"}`

---

## 📚 Full Guide

See `CREDENTIALS_SETUP_GUIDE.md` for detailed instructions.
