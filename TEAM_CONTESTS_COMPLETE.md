# Team Contests - Complete Implementation

## Overview
Team-based contest system where users/creators/brands create contests, teams register, collaborate, and compete. Platform takes 15% of entry fees, rest goes to prize pool.

## Key Points

### Contest Creation
- ✅ **Any user can create contests** (creators, brands, regular users)
- ✅ **Krieta creates contests as a brand** (not platform-level)
- ✅ **Creator specifies participation type**:
  - `INDIVIDUAL_ONLY` - Solo participants only
  - `TEAM_ONLY` - Teams only
  - `BOTH` - Mixed (individuals + teams)

### Entry Fee Logic
- Creator sets optional entry fee per participant
- **For teams**: Each member pays the entry fee
- **Platform takes 15%** of total entry fees
- **Remaining 85% added to prize pool**
- Example: 5-member team, $5 entry fee each
  - Total collected: $25
  - Platform fee (15%): $3.75
  - Added to prize pool: $21.25

### Chat Integration
- Team chat auto-created with team
- Accessible from **Team Detail screen**
- Accessible from **main Chats tab** with:
  - Team name displayed
  - Team avatar
  - "Team Chat" badge
  - Unread count

## Database Schema

### Updated Contest Model
```prisma
model Contest {
  participationType ParticipationType @default(INDIVIDUAL_ONLY)
  teamSize          Int?  // Required team size (e.g., 5)
  maxTeams          Int?  // Max teams allowed
  // ... existing fields
}

enum ParticipationType {
  INDIVIDUAL_ONLY
  TEAM_ONLY
  BOTH
}
```

### Team Models
- `Team` - Team info, leader, members
- `TeamMember` - Membership with roles
- `TeamInvitation` - Pending invites
- `TeamContestRegistration` - Team sign-ups
- `TeamSubmission` - Team entries
- `TeamSubmissionVote` - Voting
- `TeamChat` - Links to chat system

## API Endpoints

### Teams
```
POST   /api/v1/teams                          - Create team
GET    /api/v1/teams/my-teams                 - Get user's teams
POST   /api/v1/teams/:id/invite               - Invite member
POST   /api/v1/teams/invitations/:id/accept   - Accept invite
POST   /api/v1/teams/invitations/:id/reject   - Reject invite
POST   /api/v1/teams/:id/register-contest     - Register for contest
POST   /api/v1/teams/:id/submit               - Submit entry
GET    /api/v1/teams/:id/stats                - Team statistics
```

### Contests (Updated)
```
POST   /api/v1/contests  - Create contest with participationType
```

## Entry Fee Flow

### Individual Contest
1. User joins contest
2. If entry fee set, deduct from wallet
3. Platform takes 15%
4. 85% added to prize pool

### Team Contest
1. Team leader registers team
2. Each member's wallet checked for entry fee
3. Entry fee deducted from each member
4. Total collected = entry fee × team size
5. Platform takes 15% of total
6. 85% added to prize pool
7. Transaction recorded for each member

### Code Example
```typescript
// 5 members, $5 entry fee each
const entryFeePerMember = 5;
const teamSize = 5;
const totalEntryFee = 25; // 5 × $5

const platformFee = 25 × 0.15 = $3.75;
const prizePoolAddition = 25 - 3.75 = $21.25;

// Deduct $5 from each member
// Add $21.25 to contest prize pool
// Platform keeps $3.75
```

## Chat Integration Details

### Team Chat Creation
```typescript
// When team is created
const team = await createTeam({...});

// Auto-create chat room (when chat system ready)
const chat = await createChatRoom({
  type: 'TEAM',
  name: team.name,
  avatar: team.avatarUrl,
  members: [team.leaderId],
});

await createTeamChat({
  teamId: team.id,
  chatId: chat.id,
});
```

### Chat Display in Chats Tab
```kotlin
// In Chats List Screen
LazyColumn {
  items(chats) { chat ->
    when {
      chat.isTeamChat -> {
        TeamChatItem(
          teamName = chat.teamName,  // Display team name
          teamAvatar = chat.teamAvatar,
          unreadCount = chat.unreadCount,
          lastMessage = chat.lastMessage,
          badge = "Team Chat"
        )
      }
      else -> RegularChatItem(chat)
    }
  }
}
```

### Team Chat Features
- Team name as chat title
- Team avatar
- All team members auto-added
- File sharing for content collaboration
- Quick access to team contests
- Submission coordination
- Strategy discussions

## Contest Creation Flow

### Creator (Any User/Brand)
1. Navigate to Create Contest
2. Fill contest details
3. **Select participation type**:
   - Individual Only
   - Team Only
   - Both
4. If Team/Both selected:
   - Set required team size (2-10)
   - Set max teams (optional)
5. Set optional entry fee
6. Set prize distribution
7. Platform calculates:
   - If entry fee: Shows 15% platform fee
   - Shows final prize pool formula
8. Creator pays prize + 15% platform fee
9. Contest published

### Example UI
```
Participation Type:
○ Individual Only
○ Team Only  
● Both (Individual + Teams)

Team Settings:
Required Team Size: [5] members
Max Teams: [20] teams

Entry Fee (optional):
Kr [5.00] per participant

Prize Pool Calculation:
Base Prize: Kr 1000
Entry Fees (estimated): Kr 500
  - Platform Fee (15%): Kr 75
  - Added to Pool: Kr 425
Total Prize Pool: Kr 1425
```

## Frontend Implementation

### Updated Contest Creation
```kotlin
data class CreateContestRequest(
    val title: String,
    val description: String,
    val participationType: ParticipationType,
    val teamSize: Int?,
    val maxTeams: Int?,
    val entryFeeKr: Double?,
    // ... other fields
)

enum class ParticipationType {
    INDIVIDUAL_ONLY,
    TEAM_ONLY,
    BOTH
}
```

### Team Chat in Chats Screen
```kotlin
@Composable
fun ChatsScreen() {
    val chats by viewModel.chats.collectAsState()
    
    LazyColumn {
        items(chats) { chat ->
            if (chat.isTeamChat) {
                TeamChatListItem(
                    teamName = chat.teamName,
                    teamAvatar = chat.teamAvatar,
                    lastMessage = chat.lastMessage,
                    unreadCount = chat.unreadCount,
                    onClick = {
                        navigator.push(ChatScreen(chatId = chat.id))
                    }
                )
            } else {
                RegularChatListItem(chat)
            }
        }
    }
}

@Composable
fun TeamChatListItem(
    teamName: String,
    teamAvatar: String?,
    lastMessage: String,
    unreadCount: Int,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        AsyncImage(
            model = teamAvatar,
            modifier = Modifier.size(48.dp).clip(CircleShape)
        )
        
        Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
            Row {
                Text(teamName, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(8.dp))
                Badge { Text("Team") }
            }
            Text(lastMessage, maxLines = 1)
        }
        
        if (unreadCount > 0) {
            Badge { Text("$unreadCount") }
        }
    }
}
```

## Migration Steps

1. Run migration: `npm run db:migrate:run`
2. Deploy backend with teams routes
3. Deploy mobile app with team screens
4. Update contest creation UI
5. Test entry fee flow
6. Integrate with chat system (when ready)

## Testing Checklist

- [ ] Create contest with INDIVIDUAL_ONLY
- [ ] Create contest with TEAM_ONLY
- [ ] Create contest with BOTH
- [ ] Set entry fee, verify 15% platform fee
- [ ] Create team (2-10 members)
- [ ] Invite members
- [ ] Register team for contest
- [ ] Verify entry fee deducted from all members
- [ ] Verify 85% added to prize pool
- [ ] Submit team entry
- [ ] Vote on team submission
- [ ] Team chat appears in Chats tab
- [ ] Team name displayed in chat
- [ ] Team avatar shown
- [ ] Access chat from Team Detail screen

## Business Logic

### Entry Fee Distribution
```
Total Entry Fees Collected
├─ 15% → Platform Revenue
└─ 85% → Prize Pool (increases total prizes)
```

### Prize Distribution (Unchanged)
```
Final Prize Pool
├─ Rank 1: X%
├─ Rank 2: Y%
└─ Rank 3: Z%
```

### Team Prize Split
```
Team Wins Prize
├─ Split equally among all members
└─ Each member receives: Prize ÷ Team Size
```

## Notes

- Any user can create contests (not just platform)
- Krieta creates contests as a brand account
- Entry fees are optional (creator decides)
- Platform always takes 15% of entry fees
- Team chat uses main chat infrastructure
- Team size must match contest requirement
- Leaders/Co-Leaders can register & submit
- All members pay entry fee
- Prizes split equally among team members
