# Fix Cloudinary Signed Uploads

The objective is to resolve the "Upload preset must be whitelisted for unsigned uploads" error by correctly implementing **Signed Upload Presets**. This requires including the `upload_preset` parameter in the backend signature generation and sending it from the mobile app.

## User Review Required

> [!IMPORTANT]
> The Cloudinary console must have an upload preset named `Runinga` (as specified in your `.env`) and its **Signing Mode** must be set to **Signed**.

> [!NOTE]
> We will continue to use the `folder` parameter to allow dynamic routing to different folders (Profile, Shorts, etc.) while using a single signed preset. This works as long as the preset in Cloudinary has "Allow override" enabled for the folder.

## Proposed Changes

---

### [Component] Backend (Node.js/Express)

#### [MODIFY] [cloudinary.ts](file:///c:/Users/ADMIN/Runinga/backend/src/config/cloudinary.ts)
- Update `generateUploadSignature` to include `upload_preset` in the signature payload.
- Return `uploadPreset` in the result so the mobile app knows which one to use.

---

### [Component] Mobile (Kotlin/Compose)

#### [MODIFY] [CloudinaryUploader.kt](file:///c:/Users/ADMIN/Runinga/composeApp/src/commonMain/kotlin/com/runinga/com/core/network/CloudinaryUploader.kt)
- Update `CloudinarySignatureDto` to include `uploadPreset: String?`.
- Update `uploadMedia` to append `upload_preset` to the multipart form data for both standard and chunked uploads.
- Remove misleading comments about `upload_preset` being for unsigned uploads only.

## Verification Plan

### Automated Tests
- I will verify the backend signature endpoint returns the `uploadPreset` field.
- I will verify the mobile code compile-time safety.

### Manual Verification
- The user should attempt to upload a media file (Post/Short) and verify the 400 error is gone.
- Check Cloudinary Console to ensure the file landed in the correct sub-folder (e.g., `Runinga/feed/Images`).
