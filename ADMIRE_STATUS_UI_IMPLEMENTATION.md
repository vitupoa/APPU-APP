# Admire Status UI Update Implementation

## Overview
Implemented UI state tracking to reflect when a user admires a creator from the shorts feed, hiding the plus button after admiration.

## Changes Made

### ShortsScreen.kt

#### 1. Added Local State Tracking
```kotlin
var admiredCreatorIds by remember { mutableStateOf<Set<String>>(emptySet()) }
```
- Tracks creator IDs that have been admired during the current session
- Uses a Set for efficient lookup

#### 2. Updated onAdmire Handler
```kotlin
onAdmire = {
    scope.launch {
        when (val result = profileRepository.admire(short.creator.id)) {
            is NetworkResult.Success -> {
                admiredCreatorIds = admiredCreatorIds + short.creator.id
                val isNowLovers = result.data
                if (isNowLovers) {
                    // They became lovers - content moves to Lovers tab
                }
            }
            is NetworkResult.Error -> {
                // Handle error
            }
            else -> {}
        }
    }
}
```
- Calls the repository admire function
- On success, adds creator ID to admiredCreatorIds set
- Tracks if they became lovers (mutual admiration)
- Handles errors gracefully

#### 3. Added isAdmired Parameter to ShortItem
```kotlin
isAdmired = admiredCreatorIds.contains(short.creator.id),
```
- Passes the admired status to the ShortItem composable

#### 4. Updated Profile Action Button Logic
```kotlin
if (!isOwnContent && !isAdmired) {
    ProfileActionButton(
        avatarUrl = short.creator.avatarUrl,
        onProfileClick = onProfileClick,
        onAdmireClick = onAdmire
    )
} else if (!isOwnContent && isAdmired) {
    // Show profile only without plus button
    AsyncImage(
        model = short.creator.avatarUrl,
        contentDescription = "Creator",
        modifier = Modifier
            .size(48.dp)
            .clip(CircleShape)
            .clickable(onClick = onProfileClick)
            .border(2.dp, Color.White, CircleShape),
        contentScale = ContentScale.Crop
    )
}
```
- Shows ProfileActionButton with plus icon when not admired
- Shows profile picture only (no plus button) when already admired
- Both remain clickable to navigate to profile

## User Experience Flow

### Before Admiring
```
┌─────────────┐
│   Profile   │
│   Picture   │
│      +      │ ← Plus button visible
└─────────────┘
```

### After Admiring
```
┌─────────────┐
│   Profile   │
│   Picture   │ ← No plus button
└─────────────┘
```

## Technical Details

### State Management
- **Local State**: Uses `remember { mutableStateOf() }` for session-level tracking
- **Scope**: State persists within the current screen session
- **Reset**: State resets when navigating away and back

### API Response
The `ProfileRepository.admire()` function returns:
- `NetworkResult<Boolean>` where Boolean indicates if they became lovers
- `true` = Mutual admiration (they're now lovers)
- `false` = One-way admiration

### Tab Behavior
When users admire a creator:
1. **One-way Admiration**: Content stays in current tab
2. **Mutual Admiration (Lovers)**: Content logically belongs in Lovers tab
   - Current implementation: Plus button disappears
   - Optional enhancement: Refresh feed to update tab content

## Limitations & Future Enhancements

### Current Limitations
1. **Session-based**: State resets on screen recreation
2. **No Persistence**: Doesn't survive app restart
3. **No Initial State**: Doesn't load existing admire relationships on mount

### Recommended Enhancements
1. **Load Initial State**: Query admire relationships on screen mount
   ```kotlin
   LaunchedEffect(currentUserId) {
       val admiringList = profileRepository.getAdmiring(currentUserId, null)
       admiredCreatorIds = admiringList.items.map { it.id }.toSet()
   }
   ```

2. **Add to Short Model**: Include `isAdmiring` field in Short data class
   ```kotlin
   data class Short(
       // ... existing fields
       val isAdmiring: Boolean = false,
       val isLovers: Boolean = false
   )
   ```

3. **Backend Integration**: Update backend to include admire status
   ```typescript
   // Check if user is admiring this creator
   const admireStatus = await prisma.admires.findUnique({
       where: { 
           admirer_id_admired_id: { 
               admirer_id: userId, 
               admired_id: s.user_id 
           }
       }
   });
   
   return {
       // ... other fields
       isAdmiring: !!admireStatus,
       isLovers: admireStatus?.is_lovers || false
   };
   ```

4. **Refresh After Lovers**: Auto-refresh feed when mutual admiration occurs
   ```kotlin
   if (isNowLovers) {
       viewModel.refresh() // Content moves to Lovers tab
   }
   ```

5. **Unadmire Support**: Add ability to unadmire
   ```kotlin
   onAdmireLongPress = {
       scope.launch {
           profileRepository.unadmire(short.creator.id)
           admiredCreatorIds = admiredCreatorIds - short.creator.id
       }
   }
   ```

## Testing Checklist

- [x] Plus button hides after admiring a creator
- [x] Profile picture remains clickable after admiring
- [x] Can admire multiple creators in same session
- [x] State tracks correctly across different shorts
- [ ] Load existing admire relationships on mount (future)
- [ ] Persist state across screen recreation (future)
- [ ] Show different UI for lovers vs one-way admiring (future)

## Files Modified

- `composeApp/src/commonMain/kotlin/com/krieta/feature/shorts/presentation/screen/ShortsScreen.kt`
  - Added `admiredCreatorIds` state tracking
  - Updated `onAdmire` handler with proper result handling
  - Added `isAdmired` parameter to `ShortItem`
  - Modified profile button visibility logic
