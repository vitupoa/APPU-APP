# Chat Tabs Feature

## Overview
Added tab navigation to the Chats screen to filter between different chat types and access Drips feed.

## Tabs

### 1. All
- Shows all chats (direct, group, and Chama)
- Default selected tab
- Sorted by most recent activity

### 2. Groups
- Shows only normal group chats
- Filters out direct chats and Chama groups
- Uses `ChatType.GROUP` filter

### 3. Chama
- Shows only Chama group chats
- Displays Chama-specific UI with 🏦 icon
- Navigates to Chama dashboard on click

### 4. Drips
- Opens DripsScreen when clicked
- Navigates to feed of admired content
- Does not filter chat list

## Implementation Details

### ChatTab Enum
```kotlin
enum class ChatTab(val title: String) {
    ALL("All"),
    GROUP("Groups"),
    CHAMA("Chama"),
    DRIPS("Drips")
}
```

### Tab Filtering Logic
- **ALL**: Shows all chat types
- **GROUP**: Filters `ChatListItem.RegularChat` where `chat.type == ChatType.GROUP`
- **CHAMA**: Filters `ChatListItem.ChamaChat`
- **DRIPS**: Triggers navigation instead of filtering

### UI Components
- **ScrollableTabRow**: Allows horizontal scrolling if tabs overflow
- **Tab Selection**: Highlights selected tab
- **Edge Padding**: 16.dp for better visual spacing

### Search Integration
- Search works across all tabs
- Filters applied after tab filtering
- Empty states show tab-specific messages

## User Experience

1. User opens Chats tab
2. Sees "All" tab selected by default
3. Can switch between tabs to filter chats
4. Search bar filters within selected tab
5. Clicking "Drips" navigates to Drips feed
6. Tab selection persists during session

## Empty States

- **All**: "No chats found"
- **Groups**: "No groups found"
- **Chama**: "No chama groups found"

## Files Modified

1. **ChatListScreen.kt**
   - Added `ChatTab` enum
   - Added `selectedTab` state
   - Added `ScrollableTabRow` component
   - Implemented tab filtering logic
   - Added tab-specific empty states
