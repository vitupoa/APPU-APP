# Profile Banner Positioning Implementation

## Summary of Changes

### 1. Database Schema
Added two new fields to store banner position:
- `cover_photo_offset_x` (Float) - Horizontal offset (-200 to 200)
- `cover_photo_offset_y` (Float) - Vertical offset (-100 to 0)

**Migration**: `backend/prisma/migrations/add_cover_photo_offsets/migration.sql`

### 2. Backend API

**New Endpoint**: `PATCH /api/v1/users/me/banner-position`
- Updates banner position for authenticated user
- Validates offsets are within acceptable ranges
- Returns updated user data

**Files Modified**:
- `backend/src/modules/user/user.routes.ts` - Added endpoint and validation schema
- `backend/src/modules/user/user.service.ts` - Added `updateBannerPosition` method
- `backend/prisma/schema.prisma` - Added new fields to user model

### 3. Frontend (Mobile App)

**Banner Container Dimensions**:
- Container Height: 300dp (increased from 180dp)
- Banner Image Height: 500dp (to allow repositioning)
- Total Header Height: 340dp
- Avatar Size: 100dp
- Avatar Overlap: 40dp

**Features**:
- ✅ Drag to reposition banner (own profile only)
- ✅ Visual feedback while dragging (hand emoji + instructions)
- ✅ Reset button appears when banner is repositioned
- ✅ Auto-saves 1 second after dragging stops
- ✅ Loads saved position from backend
- ✅ Visitors see the same banner position

**Drag Constraints**:
- Horizontal: -200px to +200px
- Vertical: -100px to 0px (can only drag down)

**Files Modified**:
- `composeApp/.../ProfileModels.kt` - Added offset fields to UserProfile
- `composeApp/.../ProfileRepository.kt` - Added `updateBannerPosition` method
- `composeApp/.../ProfileRepositoryImpl.kt` - Implemented banner update
- `composeApp/.../ProfileApi.kt` - Added API call
- `composeApp/.../ProfileDtos.kt` - Added offset fields to DTO
- `composeApp/.../ProfileViewModel.kt` - Added update method
- `composeApp/.../ProfileScreen.kt` - Implemented drag UI and auto-save

### 4. How It Works

**For Profile Owner**:
1. Open profile tab
2. Drag banner image to desired position
3. Position auto-saves after 1 second
4. Reset button (↻) appears to restore original position
5. Visitors see the new position

**Banner Loading**:
- Image loads at 500dp height (200dp taller than container)
- User can drag to show different parts of their banner
- Position is saved to database and persists across sessions

### 5. Status Bar Fix
- Added 48dp spacer at top to prevent banner from overlapping status bar
- Banner now starts below battery/time indicators

### 6. Why Profile Pic/Banner Wasn't Saving

The backend already supports saving `avatar_url` and `cover_photo_url` via the `PUT /api/v1/users/me` endpoint. 

**Check EditProfileScreen**:
- Ensure it's sending `avatar_url` and `cover_photo_url` in the request body
- Verify the API call is using the correct endpoint
- Check that Cloudinary URLs are being passed correctly

### 7. Next Steps

**Run Migration**:
```bash
cd backend
npx prisma migrate deploy
# Or for development:
npx prisma migrate dev --name add_cover_photo_offsets
```

**Test**:
1. Upload a banner in edit profile
2. Go to profile tab
3. Drag banner to reposition
4. Check if position persists after app restart
5. View profile from another account to confirm others see the new position

## Design Decisions

1. **Why larger image size (500dp)?**
   - Gives users 200dp of extra content to pan/reposition
   - Ensures banner fully covers the container at any position

2. **Why limit vertical drag to -100 to 0?**
   - Users can only drag down (not up)
   - Prevents showing empty space above banner
   - Matches natural behavior of revealing content below

3. **Why auto-save with 1-second delay?**
   - Prevents excessive API calls while dragging
   - Saves final position automatically
   - No manual "save" button needed

4. **Why show reset button?**
   - Lets users restore original position easily
   - Only appears when banner has been repositioned
   - Clear visual indicator that position has changed
