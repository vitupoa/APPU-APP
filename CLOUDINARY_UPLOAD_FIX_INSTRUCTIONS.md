# Cloudinary Upload Fix Instructions

## Problem
The error "Upload preset must be whitelisted for unsigned uploads" occurs because Cloudinary is treating your signed upload as an unsigned upload.

## Root Cause
The upload preset "Krieta" in your Cloudinary dashboard is configured for **unsigned uploads**, but your application is performing **signed uploads**.

## Solution

### Step 1: Configure the Upload Preset in Cloudinary Dashboard

1. Go to your Cloudinary Dashboard: https://cloudinary.com/console
2. Click the **Settings** gear icon (top right)
3. Navigate to **Upload** → **Upload presets**
4. Find your preset named "Krieta" (or create it if it doesn't exist)
5. **CRITICAL**: Set the **Signing Mode** to **Signed**
   - This is the key setting that determines whether the preset accepts signed or unsigned uploads
6. Set the **Folder** to `Krieta/uploads` (this is where all uploads will go)
7. Save the preset

### Step 2: Verify the Preset Configuration

Your preset should have these settings:
- **Preset name**: `Krieta`
- **Signing mode**: `Signed` (NOT Unsigned)
- **Folder**: `Krieta/uploads`
- **Use filename**: Optional (your choice)
- **Unique filename**: Recommended to enable

### Step 3: Test the Upload

After configuring the preset:
1. Rebuild your mobile app
2. Try uploading an image
3. Check the logs for success

## Technical Details

### What the Backend Does
The backend (`backend/src/config/cloudinary.ts`) generates a signature using:
```typescript
{
  timestamp: 1776468905,
  upload_preset: "Krieta"
}
```

### What the Mobile App Sends
The mobile app sends these parameters to Cloudinary:
```
api_key: 651974261387216
timestamp: 1776468905
signature: 39a3ad6168598eb4e2fcb9c60546eb7a82b3ac3d
upload_preset: Krieta
file: [binary data]
```

### Why It Was Failing
- Your preset was configured for **unsigned uploads**
- Unsigned presets don't require signatures
- When Cloudinary received a signature with an unsigned preset, it rejected it

### Why It Will Work Now
- Your preset is now configured for **signed uploads**
- Signed presets require and validate signatures
- Cloudinary will accept your signed upload request

## Alternative: Use Unsigned Uploads (Not Recommended)

If you want to use unsigned uploads instead:
1. Configure the preset as **Unsigned** in Cloudinary dashboard
2. Add the preset to the "unsigned upload presets" whitelist
3. Remove signature generation from the backend
4. Send only `upload_preset`, `api_key`, and `file` from the mobile app

**However, signed uploads are more secure and recommended for production apps.**

## Verification

After making the changes, you should see:
- HTTP 200 response from Cloudinary
- A `secure_url` returned in the response
- The uploaded file in your Cloudinary Media Library under `Krieta/uploads/`

## Troubleshooting

If you still get errors:

1. **"Invalid signature"**: The preset name in your code doesn't match the preset name in Cloudinary dashboard (case-sensitive)
2. **"Upload preset not found"**: The preset "Krieta" doesn't exist in your Cloudinary account
3. **"Upload preset must be whitelisted"**: The preset is still configured as Unsigned instead of Signed

## Contact Support

If issues persist after following these steps, contact Cloudinary support with:
- Your cloud name: `dlfikd68s`
- The preset name: `Krieta`
- The error message
- A sample signature request
