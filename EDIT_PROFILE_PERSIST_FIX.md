# Edit Profile Not Persisting Fix

## Issue
When editing profile, changes were not being saved to the backend. Specifically, `selectedNiches` and `customNiches` were not being sent or persisted.

## Root Cause
1. **Frontend ViewModel**: EditProfileViewModel's `save()` function was not sending `selectedNiches` and `customNiches` to the repository
2. **Repository Interface**: ProfileRepository didn't accept niches parameters in `updateProfile()`
3. **DTO**: UpdateProfileRequestDto was missing `selectedNiches` and `customNiches` fields
4. **Backend Validation**: Zod schema didn't include niches fields
5. **Backend Service**: UserService.updateProfile() wasn't handling niches in the update

## Files Changed

### Frontend
1. **UpdateProfileRequestDto** (`composeApp/src/commonMain/kotlin/com/krieta/feature/profile/data/remote/dto/ProfileDtos.kt`)
   - Added `selectedNiches: List<String>?`
   - Added `customNiches: List<String>?`

2. **ProfileRepository** (`composeApp/src/commonMain/kotlin/com/krieta/feature/profile/domain/repository/ProfileRepository.kt`)
   - Added parameters to `updateProfile()`: `selectedNiches: List<String>? = null, customNiches: List<String>? = null`

3. **ProfileRepositoryImpl** (`composeApp/src/commonMain/kotlin/com/krieta/feature/profile/data/repository/ProfileRepositoryImpl.kt`)
   - Updated `updateProfile()` to pass niches to DTO

4. **EditProfileViewModel** (`composeApp/src/commonMain/kotlin/com/krieta/feature/profile/presentation/viewmodel/EditProfileViewModel.kt`)
   - Updated `save()` to send niches: `selectedNiches = if (s.selectedNiches != p.selectedNiches) s.selectedNiches else null`

### Backend
1. **user.routes.ts** (`backend/src/modules/user/user.routes.ts`)
   - Added to `updateProfileSchema`:
     ```typescript
     selectedNiches: z.array(z.string()).max(5).optional(),
     customNiches: z.array(z.string()).max(3).optional()
     ```

2. **user.service.ts** (`backend/src/modules/user/user.service.ts`)
   - Added `selectedNiches?: string[]` and `customNiches?: string[]` to interface
   - Added update logic:
     ```typescript
     if (data.selectedNiches !== undefined) updateData.selectedNiches = data.selectedNiches;
     if (data.customNiches !== undefined) updateData.customNiches = data.customNiches;
     ```

## Result
All profile changes including niches are now properly persisted to the database.
