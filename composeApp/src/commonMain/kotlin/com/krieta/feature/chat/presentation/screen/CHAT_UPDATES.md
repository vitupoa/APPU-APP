# Chat and Stories UI Updates

## Changes Made

### 1. Story Border Colors
- **MyStoryItem**: Changed border from blue to yellow (`Color(0xFFFFCC00)`) when user has stories
- **AddStoryItem**: Added grey border (`Color.LightGray`) when user has no stories
- **Badge Color**: Changed "+" badge background to yellow with black text

### 2. Floating Action Button Color
- Changed FAB container color from `MaterialTheme.colorScheme.primary` to yellow (`Color(0xFFFFCC00)`)
- Changed icon tint to black for better contrast

### 3. Real-Time User Search
- **UserSearchViewModel**: Created with debounced search (400ms delay)
- Uses `ProfileRepository.searchUsers()` API
- Displays full name, username, and avatar in search results
- Automatically creates direct chat when user is selected
- Navigates to chat room after successful creation

### 4. Group Creation with Persistence
- **CreateGroupViewModel**: Created with user search and group creation logic
- Uses `ChatRepository.createGroupChat()` API
- Validates minimum 2 members before creation
- Shows loading state during creation
- Navigates to group chat room after successful creation

### 5. Group Visibility
- Backend API `GET /api/v1/chat` returns only chats where user is a participant
- Includes both direct chats and group chats (normal and Chama)
- Groups persist automatically via backend filtering
- ChatListScreen displays all user's chats sorted by `updatedAt`

## API Endpoints Used

### User Search
- **Endpoint**: `GET /api/v1/profile/search?query={query}`
- **Returns**: List of users matching search query
- **Fields**: id, username, displayName, avatarUrl

### Create Direct Chat
- **Endpoint**: `POST /api/v1/chat/direct`
- **Body**: `{ recipientId: string }`
- **Returns**: Chat object with id

### Create Group Chat
- **Endpoint**: `POST /api/v1/chat/group`
- **Body**: `{ name: string, description?: string, participantIds: string[] }`
- **Returns**: Chat object with id

### Get Chats
- **Endpoint**: `GET /api/v1/chat?page=1&limit=20`
- **Returns**: List of chats where user is a participant
- **Includes**: Direct chats, normal groups, and Chama groups

## Files Modified

1. `StoriesRow.kt` - Updated MyStoryItem and AddStoryItem border colors
2. `ChatListScreen.kt` - Changed FAB color to yellow
3. `UserSearchScreen.kt` - Integrated ViewModel with real-time search
4. `CreateGroupScreen.kt` - Integrated ViewModel with group creation
5. `ChatModule.kt` - Registered new ViewModels

## Files Created

1. `UserSearchViewModel.kt` - Handles user search with debouncing
2. `CreateGroupViewModel.kt` - Handles group creation flow

## Technical Details

### Debouncing
- Search queries debounced by 400ms to prevent API overload
- Uses Kotlin Flow's `debounce()` operator
- Minimum 2 characters required before search triggers

### State Management
- Both ViewModels use StateFlow for reactive UI updates
- Loading states shown during API calls
- Error messages displayed via Snackbar
- Success navigation handled via LaunchedEffect

### Persistence
- Groups persist automatically via backend
- No local storage needed
- ChatListViewModel reloads on WebSocket events
- Groups appear in chat list immediately after creation
