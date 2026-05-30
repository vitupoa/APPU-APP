# Firebase Cloud Messaging (FCM) Setup Guide

## 📥 Download Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (e.g., `krieta-firebase-adminsdk.json`)

---

## 🔑 Extract Credentials from JSON

Your downloaded JSON file looks like this:

```json
{
  "type": "service_account",
  "project_id": "krieta-app",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@krieta-app.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

## 🚀 Add to Railway Environment Variables

### Option 1: Railway Dashboard (Recommended)

1. Go to your Railway project
2. Click on your backend service
3. Go to **Variables** tab
4. Add these three variables:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `FIREBASE_PROJECT_ID` | Copy `project_id` from JSON | `krieta-app` |
| `FIREBASE_CLIENT_EMAIL` | Copy `client_email` from JSON | `firebase-adminsdk-xxxxx@krieta-app.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Copy entire `private_key` from JSON (including BEGIN/END lines) | `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n` |

### Option 2: Railway CLI

```bash
railway variables set FIREBASE_PROJECT_ID="krieta-app"
railway variables set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@krieta-app.iam.gserviceaccount.com"
railway variables set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
-----END PRIVATE KEY-----
"
```

---

## ⚠️ Important Notes

### 1. **Keep `\n` as Literal Characters**
When copying the `private_key`, keep the `\n` characters as **literal backslash-n**, NOT actual newlines.

✅ **CORRECT**:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n
```

❌ **WRONG** (actual newlines):
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
-----END PRIVATE KEY-----
```

### 2. **Include BEGIN and END Lines**
Make sure to copy the entire key including:
- `-----BEGIN PRIVATE KEY-----`
- The key content
- `-----END PRIVATE KEY-----`

### 3. **No Extra Spaces**
Don't add spaces before or after the key.

---

## 🧪 Test FCM Setup

After adding the environment variables, test the FCM service:

```bash
# Restart your Railway service
railway up

# Check logs for FCM initialization
railway logs
```

You should see:
```
[FCM] Firebase Admin SDK initialized successfully
```

---

## 🔧 Troubleshooting

### Error: "Invalid private key"
- Make sure you copied the entire key including BEGIN/END lines
- Verify `\n` characters are literal (not actual newlines)
- Check for extra spaces or quotes

### Error: "Project ID not found"
- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Check for typos in the project ID

### Error: "Invalid client email"
- Ensure you copied the full email address
- Verify it ends with `.iam.gserviceaccount.com`

---

## 📱 Enable FCM in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Build** → **Cloud Messaging**
4. If prompted, enable Cloud Messaging API
5. Note your **Server Key** (not needed for Admin SDK, but useful for reference)

---

## 🔐 Security Best Practices

1. ✅ **Never commit** the JSON file to Git
2. ✅ **Never share** the private key publicly
3. ✅ **Use environment variables** for all credentials
4. ✅ **Rotate keys** periodically (generate new service account)
5. ✅ **Limit permissions** to only what's needed (Cloud Messaging)

---

## 📖 How It Works in Your Code

Your `fcm.service.ts` automatically uses these environment variables:

```typescript
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
```

The `.replace(/\\n/g, '\n')` converts literal `\n` to actual newlines for the SDK.

---

## ✅ Verification Checklist

- [ ] Downloaded Firebase service account JSON
- [ ] Extracted `project_id`, `client_email`, and `private_key`
- [ ] Added all 3 variables to Railway
- [ ] Verified `\n` characters are literal (not actual newlines)
- [ ] Included BEGIN/END lines in private key
- [ ] Restarted Railway service
- [ ] Checked logs for successful initialization
- [ ] Tested sending a notification

---

## 🎯 Quick Copy Template

Use this template to add variables in Railway:

```bash
# Copy these values from your JSON file:

FIREBASE_PROJECT_ID=
# Paste: project_id value

FIREBASE_CLIENT_EMAIL=
# Paste: client_email value

FIREBASE_PRIVATE_KEY=
# Paste: entire private_key value (including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----)
```

---

## 📞 Need Help?

If you encounter issues:
1. Double-check the JSON file structure
2. Verify all 3 variables are set in Railway
3. Check Railway logs for specific error messages
4. Ensure Firebase Cloud Messaging API is enabled in your project

---

**Last Updated**: December 2024  
**Status**: ✅ READY TO USE
