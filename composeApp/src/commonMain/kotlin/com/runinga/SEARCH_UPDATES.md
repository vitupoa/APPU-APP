# Search Functionality Updates

## Changes Made

### 1. Explore Tab - Group Search
- **SearchViewModel**: Updated to search both users and groups simultaneously
- **SearchResultType**: Added `GROUP` type
- **API Integration**: Added `ChatRepository.searchGroups()` method
- **Search Placeholder**: Updated to "Search users, groups, products, contests…"
- **Results Display**: Groups show with 👥 emoji and member count
- **Navigation**: Clicking group result opens chat room

### 2. Chats Tab - Local Search
- **Search Bar**: Added search field below stories row
- **Filter Logic**: Searches through:
  - Direct chats: by display name and username
  - Group chats: by group name
  - Chama groups: by name and description
- **Real-time Filtering**: Updates as user types
- **Clear Button**: X icon to clear search query
- **Case Insensitive**: Search ignores case

## API Endpoints

### Search Groups
- **Endpoint**: `GET /api/v1/chat/search?query={query}&type=GROUP`
- **Returns**: List of group chats matching query
- **Filters**: Only returns groups where user is a member

## Files Modified

1. **SearchViewModel.kt**
   - Added `ChatRepository` dependency
   - Combined user and group search results
   - Added GROUP to SearchResultType enum

2. **Tabs.kt** (ExploreScreen)
   - Updated search placeholder text
   - Added GROUP case to search result navigation
   - Added GROUP emoji (👥) and color (green)

3. **ChatListScreen.kt**
   - Added search bar with OutlinedTextField
   - Implemented local filtering logic
   - Added clear button functionality

4. **ChatRepository.kt**
   - Added `searchGroups()` interface method

5. **ChatApi.kt**
   - Added `searchGroups()` API call

6. **ChatRepositoryImpl.kt**
   - Implemented `searchGroups()` with DTO mapping

7. **ProfileModule.kt**
   - Updated SearchViewModel factory to inject ChatRepository

## Technical Details

### Explore Tab Search
- **Debounce**: 300ms delay before API call
- **Minimum Characters**: 2 characters required
- **Parallel Search**: Users and groups searched simultaneously
- **Combined Results**: Both result types displayed in single list

### Chats Tab Search
- **Local Filtering**: No API calls, filters existing chat list
- **Instant Results**: No debounce, updates immediately
- **Search Fields**:
  - Direct chats: `displayName`, `username`
  - Group chats: `name`
  - Chama groups: `name`, `description`

### Group Search Results
- **Title**: Group name
- **Subtitle**: "{count} members"
- **Icon**: 👥 emoji
- **Color**: Green (#43A047)
- **Action**: Opens chat room on click

## User Experience

### Explore Tab
1. User types in search bar
2. After 300ms, searches users and groups
3. Results show with type indicators
4. Click user → profile, click group → chat room

### Chats Tab
1. User types in search bar
2. Chat list filters instantly
3. Shows matching direct chats, groups, and chamas
4. Clear button (X) resets to full list
5. Search persists while navigating within tab
