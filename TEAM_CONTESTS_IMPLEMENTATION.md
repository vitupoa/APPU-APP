# Team Contests Implementation

## Overview
Complete team-based contest system where users form teams, collaborate on submissions, and compete for shared prizes.

## Why Team Contests Matter

### 1. Viral Growth Engine
- **Friend Invitations**: Each team member invites 2-4 friends
- **Network Effect**: 5-person team = 10-20 new user invites
- **Exponential Growth**: Teams recruit → New teams form → More recruitment

### 2. Higher Engagement
- **Team Accountability**: Members keep each other active
- **Collaborative Content**: Better quality submissions
- **Social Pressure**: Don't let teammates down
- **Regular Check-ins**: Team coordination increases app opens

### 3. Bigger Prize Pools
- **Pooled Entry Fees**: 5 members × $5 = $25 entry
- **Larger Prizes**: Attracts serious competitors
- **Brand Sponsorships**: Companies sponsor team contests
- **Corporate Teams**: Businesses enter branded teams

### 4. Community Building
- **Loyal User Groups**: Teams create lasting bonds
- **Team Identity**: Badges, avatars, team names
- **Rivalry**: Teams compete repeatedly
- **Team History**: Shared achievements

### 5. Retention Boost
- **Social Bonds**: Users stay for teammates
- **Team Goals**: Long-term objectives
- **Team Chat**: Daily communication
- **Team Events**: Exclusive contests

## Features Implemented

### 1. Team Management
- Create team (2-10 members)
- Invite members via username/link
- Accept/reject invitations
- Role system (Leader, Co-Leader, Member)
- Leave/kick members
- Team avatar & name

### 2. Team Contests
- Team-specific contests
- Required team size (e.g., 5 members)
- Max teams limit
- Team registration
- Collaborative submissions
- Team leaderboard

### 3. Team Submissions
- One submission per team
- Multiple contributors
- Approval workflow (optional)
- Team voting power
- Shared credit

### 4. Team Chat Integration
- Links to main chat feature
- Team-specific chat room
- Accessible from Chats tab
- Real-time coordination
- File sharing for content

### 5. Team Statistics
- Total contests entered
- Wins & top-3 finishes
- Total prizes won
- Win rate
- Average rank
- Team history

## Database Schema

### Tables Created
1. **teams** - Team information
2. **team_members** - Team membership
3. **team_invitations** - Pending invites
4. **team_contests** - Team-specific contests
5. **team_contest_registrations** - Team sign-ups
6. **team_submissions** - Team entries
7. **team_submission_votes** - Voting
8. **team_chats** - Chat integration

### Key Relationships
```
teams (1) → (N) team_members
teams (1) → (N) team_invitations
teams (1) → (N) team_submissions
team_contests (1) → (N) team_submissions
team_submissions (1) → (N) team_submission_votes
teams (1) → (1) team_chats → main chat system
```

## API Endpoints

### Team Management
```
POST   /api/v1/teams                    - Create team
GET    /api/v1/teams/my-teams           - Get user's teams
GET    /api/v1/teams/:id                - Get team details
POST   /api/v1/teams/:id/invite         - Invite member
POST   /api/v1/teams/invitations/:id/accept - Accept invite
POST   /api/v1/teams/invitations/:id/reject - Reject invite
GET    /api/v1/teams/invitations/pending - Get pending invites
POST   /api/v1/teams/:id/leave          - Leave team
DELETE /api/v1/teams/:id/members/:memberId - Remove member
PUT    /api/v1/teams/:id/members/:memberId/role - Update role
GET    /api/v1/teams/:id/stats          - Get team stats
```

### Team Contests
```
GET    /api/v1/contests/team            - List team contests
POST   /api/v1/contests/team/:id/register - Register team
POST   /api/v1/contests/team/:id/submit - Submit entry
GET    /api/v1/contests/team/:id/submissions - Get submissions
POST   /api/v1/contests/team/submissions/:id/vote - Vote
```

## Frontend Components

### Screens
1. **TeamsListScreen** - User's teams
2. **CreateTeamScreen** - Team creation
3. **TeamDetailScreen** - Team info & members
4. **TeamInvitationsScreen** - Pending invites
5. **TeamContestsScreen** - Available team contests
6. **TeamSubmissionScreen** - Create team entry
7. **TeamLeaderboardScreen** - Contest rankings
8. **TeamStatsScreen** - Team performance

### Navigation Flow
```
Home → Teams Tab → My Teams
                → Create Team
                → Team Detail → Members
                              → Stats
                              → Chat (links to Chats feature)
                              → Contests
                              → Submit Entry
```

## Chat Integration

### How It Works
1. Team created → Auto-create chat room
2. Chat ID stored in `team_chats` table
3. Team members auto-added to chat
4. Chat accessible from:
   - Team Detail screen
   - Main Chats tab (shows team icon)
5. Team chat has special features:
   - Team name as chat title
   - Team avatar
   - "Team Chat" badge
   - Quick access to team contests

### Implementation
```kotlin
// In Team Detail Screen
Button(onClick = {
    navigator.push(ChatScreen(chatId = team.chatId))
}) {
    Text("Team Chat")
}

// In Chats List
LazyColumn {
    items(chats) { chat ->
        if (chat.isTeamChat) {
            TeamChatItem(chat) // Special UI
        } else {
            RegularChatItem(chat)
        }
    }
}
```

## User Flows

### Creating a Team
1. User clicks "Create Team"
2. Enters team name, avatar
3. Sets max members (2-10)
4. Team created, user becomes Leader
5. Auto-creates team chat
6. User invites members

### Joining a Team
1. User receives invitation (push notification)
2. Views invitation in Invitations screen
3. Sees team info, current members
4. Accepts → Added to team & chat
5. Rejects → Invitation closed

### Entering Team Contest
1. Team browses team contests
2. Leader registers team
3. Team discusses in chat
4. Members collaborate on content
5. Leader/Co-Leader submits entry
6. All members credited
7. Team votes together

### Winning Team Contest
1. Team wins contest
2. Prize split equally among members
3. All members get notification
4. Prize added to each wallet
5. Team stats updated
6. Achievement unlocked

## Business Model

### Revenue Streams
1. **Entry Fees**: Teams pay higher fees
2. **Premium Teams**: Unlock features
3. **Team Badges**: Cosmetic purchases
4. **Sponsored Contests**: Brands pay for team contests
5. **Team Subscriptions**: Monthly team perks

### Pricing Example
- Solo contest entry: $5
- Team contest entry: $20 (5 members × $4)
- Platform takes 15%: $3
- Prize pool: $17 per team

## Gamification

### Team Levels
- **Bronze**: 0-5 contests
- **Silver**: 6-15 contests
- **Gold**: 16-30 contests
- **Platinum**: 31+ contests

### Team Achievements
- 🏆 First Win
- 🔥 Win Streak (3 in a row)
- 💎 Top 3 Finish (10 times)
- 👑 Contest Champion (5 wins)
- 🌟 Perfect Score (100% win rate, 10+ contests)

### Team Perks
- Custom team colors
- Exclusive team badges
- Priority contest access
- Featured team spotlight
- Team verification checkmark

## Analytics & Metrics

### Track These KPIs
- Team creation rate
- Average team size
- Invitation acceptance rate
- Team retention (30/60/90 day)
- Team contest participation
- Team prize distribution
- Team chat activity
- Team referral rate

### Success Metrics
- 30% of users in teams (target)
- 60% invitation acceptance rate
- 2.5x higher retention for team members
- 3x higher contest participation
- 40% of revenue from team contests

## Implementation Priority

### Phase 1: Core (Week 1-2)
- [ ] Database schema
- [ ] Team CRUD APIs
- [ ] Team management screens
- [ ] Invitation system
- [ ] Basic team contests

### Phase 2: Contests (Week 3)
- [ ] Team contest creation
- [ ] Team registration
- [ ] Team submissions
- [ ] Team leaderboard
- [ ] Prize distribution

### Phase 3: Chat Integration (Week 4)
- [ ] Link teams to chat system
- [ ] Team chat UI
- [ ] Chat notifications
- [ ] File sharing for content

### Phase 4: Polish (Week 5)
- [ ] Team stats & history
- [ ] Achievements & badges
- [ ] Team levels
- [ ] Analytics dashboard

## Testing Checklist

- [ ] Create team with 2-10 members
- [ ] Invite members via username
- [ ] Accept/reject invitations
- [ ] Leave team
- [ ] Kick member (Leader only)
- [ ] Promote to Co-Leader
- [ ] Register for team contest
- [ ] Submit team entry
- [ ] Vote on submissions
- [ ] Win contest, split prize
- [ ] Access team chat
- [ ] View team stats
- [ ] Team appears in Chats tab

## Future Enhancements

1. **Team Tournaments**: Multi-round competitions
2. **Team Leagues**: Seasonal rankings
3. **Team Merch**: Custom team merchandise
4. **Team Streaming**: Live team events
5. **Team Sponsorships**: Brand partnerships
6. **Cross-Team Challenges**: Team vs Team
7. **Team Training**: Skill-building content
8. **Team Analytics**: Performance insights

## Notes

- Team chat uses main chat infrastructure
- Teams can enter both solo & team contests
- Prize split is always equal among members
- Leader can transfer leadership
- Inactive teams auto-dissolve after 90 days
- Max 3 teams per user
- Team names must be unique
- Invitations expire after 7 days

## Migration Path

1. Run `add_team_contests.sql` migration
2. Deploy backend with team APIs
3. Deploy mobile app with team screens
4. Announce team contests feature
5. Create first team contest
6. Monitor adoption & iterate
