# Cloudinary Upload Debug Steps

## Current Status
- ✅ Preset "Krieta" is configured as **Signed**
- ✅ Asset folder is set to "Krieta/uploads"
- ✅ Backend code is generating signature with `timestamp` and `upload_preset`
- ✅ Mobile app is sending `api_key`, `timestamp`, `signature`, and `upload_preset`
- ❌ Still getting "Upload preset must be whitelisted for unsigned uploads" error

## Debugging Steps

### Step 1: Restart Backend Server
**CRITICAL**: After making code changes, you MUST restart your backend server!

```bash
# Stop the current backend process
# Then restart it
cd backend
npm run dev
# or
yarn dev
```

### Step 2: Check Backend Logs
When you make an upload request, check your backend console for these logs:

```
[Cloudinary Signature] Generating signature for folder: Krieta/feed/Images, resourceType: image
[Cloudinary] Params being signed: {
  "timestamp": 1776468905,
  "upload_preset": "Krieta"
}
[Cloudinary] Generated signature: 39a3ad6168598eb4e2fcb9c60546eb7a82b3ac3d
[Cloudinary Signature] Generated signature with timestamp: 1776468905
```

### Step 3: Verify Signature Parameters
The signature MUST be generated from EXACTLY these parameters:
- `timestamp`: Unix timestamp (e.g., 1776468905)
- `upload_preset`: "Krieta" (exact case match)

NO other parameters should be included in the signature for signed presets.

### Step 4: Check Mobile App Logs
Your mobile app should log:

```
Cloudinary Signature Response: signature=..., timestamp=..., uploadPreset=Krieta, resourceType=image
Cloudinary Upload URL: https://api.cloudinary.com/v1_1/dlfikd68s/image/upload
Cloudinary Upload Parameters being sent:
  - api_key: 651974261387216
  - timestamp: 1776468905
  - signature: 39a3ad6168598eb4e2fcb9c60546eb7a82b3ac3d
  - upload_preset: Krieta
```

### Step 5: Verify Preset Name Match
**CRITICAL**: The preset name in your code MUST exactly match the preset name in Cloudinary dashboard.

- Dashboard preset name: `Krieta` (capital K)
- Code preset name: `Krieta` (capital K)
- ✅ These match!

### Step 6: Test with Postman/cURL
Test the upload directly to verify the signature is correct:

```bash
curl -X POST \
  https://api.cloudinary.com/v1_1/dlfikd68s/image/upload \
  -F "api_key=YOUR_API_KEY" \
  -F "timestamp=TIMESTAMP_FROM_BACKEND" \
  -F "signature=SIGNATURE_FROM_BACKEND" \
  -F "upload_preset=Krieta" \
  -F "file=@/path/to/test/image.jpg"
```

Replace:
- `YOUR_API_KEY` with your actual API key
- `TIMESTAMP_FROM_BACKEND` with the timestamp from your backend logs
- `SIGNATURE_FROM_BACKEND` with the signature from your backend logs

### Step 7: Check Cloudinary Dashboard Settings
Verify these settings in your Cloudinary dashboard:

1. Go to Settings → Upload → Upload presets
2. Click on "Krieta" preset
3. Verify:
   - ✅ Signing mode: **Signed**
   - ✅ Asset folder: `Krieta/uploads`
   - ❓ **Allowed formats**: Check if there are any format restrictions
   - ❓ **Allowed resource types**: Ensure "image" and "video" are allowed

### Step 8: Check for Additional Restrictions
In your Cloudinary preset, check if there are any additional restrictions:

- **Allowed formats**: Should include jpeg, jpg, png, mp4, etc.
- **Max file size**: Should be large enough for your uploads
- **Allowed resource types**: Should include "image" and "video"
- **Access mode**: Should be "public" or "authenticated" (not "private")

## Common Issues and Solutions

### Issue 1: Old Code Still Running
**Solution**: Restart backend server after code changes

### Issue 2: Preset Name Mismatch
**Solution**: Ensure exact case match between code and dashboard

### Issue 3: Wrong Parameters in Signature
**Solution**: Only sign `timestamp` and `upload_preset` for signed presets

### Issue 4: API Secret Mismatch
**Solution**: Verify your `.env` file has the correct `CLOUDINARY_API_SECRET`

### Issue 5: Preset Not Found
**Solution**: Verify the preset "Krieta" exists in your Cloudinary account

## Next Steps

1. **Restart your backend server** (most important!)
2. Try uploading again
3. Check both backend and mobile app logs
4. If still failing, test with cURL to isolate the issue
5. If cURL works but mobile app doesn't, the issue is in the mobile app
6. If cURL also fails, the issue is in the signature generation or preset configuration

## Expected Success Response

When it works, you should see:

```json
{
  "secure_url": "https://res.cloudinary.com/dlfikd68s/image/upload/v1776468905/Krieta/uploads/abc123.jpg",
  "public_id": "Krieta/uploads/abc123",
  "version": 1776468905,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2026-04-18T02:35:05Z",
  "bytes": 123456,
  "width": 1920,
  "height": 1080
}
```

## Still Not Working?

If you've tried all the above and it's still not working, please provide:

1. Backend console logs (full output when making upload request)
2. Mobile app logs (full output when making upload request)
3. Screenshot of your Cloudinary preset configuration
4. Result of the cURL test command

This will help identify the exact issue.
