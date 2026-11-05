# CLOUDINARY WEBHOOK SETUP FOR RAILWAY

## 🚀 Your Railway Configuration

**Railway Domain**: `appu-app-production.up.railway.app`

---

## 📋 Cloudinary Webhook Setup Steps

### Step 1: Go to Cloudinary Dashboard

1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Click on **Settings** (gear icon in top right)
3. Navigate to **Webhooks** section

### Step 2: Add Notification URL

Click **"Add notification URL"** and enter:

```
https://appu-app-production.up.railway.app/api/v1/media/cloudinary-webhook
```

### Step 3: Select Events

Check these events:
- ✅ **Upload** (required)
- ✅ **Delete** (optional but recommended)

### Step 4: Save

Click **"Save"** to activate the webhook.

---

## ✅ Verification

### Test Webhook is Working

After setup, test the webhook:

```bash
# 1. Get upload signature
curl https://appu-app-production.up.railway.app/api/v1/media/upload-signature?folder=Runinga/profile/Images \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Upload a test image to Cloudinary with the signature
# (Use the signature from step 1)

# 3. Check your Railway logs
# You should see:
# [Cloudinary Webhook] Upload validated: Runinga/profile/Images/...
```

### Check Railway Logs

```bash
# In Railway dashboard:
1. Go to your project
2. Click on your service
3. Click "Deployments" tab
4. Click "View Logs"
5. Look for "[Cloudinary Webhook]" messages
```

---

## 🔒 Security Notes

### Webhook Signature Verification

The webhook endpoint automatically verifies Cloudinary's signature using:
- `X-Cld-Signature` header
- `X-Cld-Timestamp` header
- Your `CLOUDINARY_API_SECRET`

**No additional configuration needed** - it's already implemented!

---

## 🧪 Testing

### Test 1: Valid Upload

```bash
# 1. Get signature
curl https://appu-app-production.up.railway.app/api/v1/media/upload-signature?folder=Runinga/profile/Images \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "signature": "abc123...",
  "timestamp": 1234567890,
  "folder": "Runinga/profile/Images",
  "apiKey": "your_api_key",
  "cloudName": "your_cloud_name"
}

# 2. Upload to Cloudinary
curl -X POST https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload \
  -F "file=@test.jpg" \
  -F "signature=abc123..." \
  -F "timestamp=1234567890" \
  -F "folder=Runinga/profile/Images" \
  -F "api_key=your_api_key"

# 3. Check Railway logs - should see:
# [Cloudinary Webhook] Upload validated: Runinga/profile/Images/test
```

### Test 2: Invalid Folder (Should be Deleted)

```bash
# Try to upload to unauthorized folder directly in Cloudinary
# The webhook will detect it and delete it automatically

# Check Railway logs - should see:
# [Cloudinary Webhook] Invalid folder for upload: unauthorized/folder/test
# Upload deleted due to invalid folder
```

---

## 📊 Monitor Uploads

### Get Upload Statistics

```bash
curl https://appu-app-production.up.railway.app/api/v1/media/cloudinary-stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response:
{
  "totalUploads": 123,
  "totalBytes": 12345678,
  "byResourceType": {
    "image": 100,
    "video": 23
  },
  "byFolder": {
    "Runinga/profile/Images": 50,
    "Runinga/shorts/Videos": 23
  }
}
```

---

## 🔧 Troubleshooting

### Webhook Not Receiving Notifications

**Check 1: Verify URL is correct**
```
✅ https://appu-app-production.up.railway.app/api/v1/media/cloudinary-webhook
❌ http://appu-app-production.up.railway.app/api/v1/media/cloudinary-webhook (no HTTPS)
❌ https://appu-app-production.up.railway.app/cloudinary-webhook (missing /api/v1/media)
```

**Check 2: Verify Railway service is running**
```bash
# Check Railway dashboard
# Service should show "Active" status
```

**Check 3: Check Railway logs**
```bash
# Look for any errors in Railway logs
# Search for "Cloudinary Webhook" messages
```

**Check 4: Test webhook endpoint manually**
```bash
curl -X POST https://appu-app-production.up.railway.app/api/v1/media/cloudinary-webhook \
  -H "Content-Type: application/json" \
  -d '{"notification_type": "upload"}'

# Expected: 401 Missing signature (this is correct - means endpoint is working)
```

### Webhook Returns 401 Error

This is **NORMAL** if:
- Testing manually without Cloudinary signature
- Cloudinary signature is invalid

This is **CORRECT BEHAVIOR** - it means signature verification is working!

### Uploads Not Being Validated

**Check 1: Verify webhook is configured in Cloudinary**
```
1. Go to Cloudinary Dashboard
2. Settings > Webhooks
3. Verify URL is listed and enabled
```

**Check 2: Verify events are selected**
```
Make sure "Upload" event is checked
```

**Check 3: Check Railway logs**
```
Look for webhook notifications in logs
If no logs, webhook might not be configured correctly
```

---

## 🎯 Quick Reference

### Your URLs

| Purpose | URL |
|---------|-----|
| **Webhook Notification** | `https://appu-app-production.up.railway.app/api/v1/media/cloudinary-webhook` |
| **Get Upload Signature** | `https://appu-app-production.up.railway.app/api/v1/media/upload-signature` |
| **Upload Statistics** | `https://appu-app-production.up.railway.app/api/v1/media/cloudinary-stats` |

### Allowed Folders

```
Runinga/profile/Images
Runinga/profile/Videos
Runinga/shorts/Videos
Runinga/shorts/Images
Runinga/contests/Images
Runinga/contests/Videos
Runinga/drips/Images
Runinga/shop/Images
Runinga/chat/Images
Runinga/chat/Videos
Runinga/chat/Audio
Runinga/stories/Images
Runinga/stories/Videos
```

---

## ✅ Setup Checklist

- [ ] Cloudinary webhook configured with Railway URL
- [ ] "Upload" event selected
- [ ] Webhook saved and enabled
- [ ] Test upload performed
- [ ] Railway logs show webhook notifications
- [ ] Upload statistics accessible
- [ ] Frontend updated to use signed uploads
- [ ] "Runinga" upload preset disabled in Cloudinary

---

## 📞 Support

If you encounter issues:

1. **Check Railway logs** for error messages
2. **Verify webhook URL** is exactly as shown above
3. **Test endpoint manually** to ensure it's accessible
4. **Check Cloudinary webhook status** in dashboard

---

**Railway Domain**: `appu-app-production.up.railway.app`  
**Webhook URL**: `https://appu-app-production.up.railway.app/api/v1/media/cloudinary-webhook`  
**Status**: ✅ Ready to configure
