import re

with open('c:/Users/ADMIN/Krieta/backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. User relation
content = content.replace('liveSessionsHosted    LiveSession[]     @relation("LiveHost")', 'liveStreamsHosted      LiveStream[]      @relation("LiveHost")')
# Add calls to User model
content = content.replace('logisticsCompany      LogisticsCompany?', 'logisticsCompany      LogisticsCompany?\n  calls                 Call[]')

# 2. Product relation
content = content.replace('liveSessionProducts LiveSessionProduct[]', 'livePinnedProducts  LivePinnedProduct[]')

# 3. Enum replacement
content = re.sub(r'enum LiveSessionStatus \{[^}]+\}', '''enum LiveStreamType {
  NORMAL
  CHAMA
  CONTEST_BATTLE
  PROOF_OF_TASK
  COMMERCE
}

enum LiveStreamStatus {
  SCHEDULED
  LIVE
  ENDED
  CANCELLED
}''', content)

# 4. Model replacement
old_models = '''// ─── LIVE SHOPPING ──────────────────────────────────────

model LiveSession {
  id              String            @id @default(uuid())
  hostId          String            @map("host_id")
  title           String
  description     String?
  scheduledStart  DateTime          @map("scheduled_start")
  actualStart     DateTime?         @map("actual_start")
  endedAt         DateTime?         @map("ended_at")
  status          LiveSessionStatus @default(SCHEDULED)
  viewerCount     Int               @default(0) @map("viewer_count")
  peakViewers     Int               @default(0) @map("peak_viewers")
  totalSales      Int               @default(0) @map("total_sales")
  totalRevenueKr  Decimal           @default(0) @map("total_revenue_kr") @db.Decimal(18, 4)
  streamUrl       String?           @map("stream_url")
  createdAt       DateTime          @default(now()) @map("created_at")

  host     User                 @relation("LiveHost", fields: [hostId], references: [id])
  products LiveSessionProduct[]

  @@index([status, scheduledStart])
  @@map("live_sessions")
}

model LiveSessionProduct {
  id            String   @id @default(uuid())
  sessionId     String   @map("session_id")
  productId     String   @map("product_id")
  salePrice     Decimal? @map("sale_price") @db.Decimal(18, 4)
  unitsSold     Int      @default(0) @map("units_sold")
  featuredAt    DateTime? @map("featured_at")
  sortOrder     Int      @default(0) @map("sort_order")

  session LiveSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  product Product     @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([sessionId, productId])
  @@map("live_session_products")
}'''

new_models = '''// ─── LIVE STREAMING (FULL) ──────────────────────────────

model LiveStream {
  id              String           @id @default(uuid())
  hostId          String           @map("host_id")
  title           String
  description     String?          @db.Text
  thumbnailUrl    String?          @map("thumbnail_url")
  type            LiveStreamType   @default(NORMAL)
  status          LiveStreamStatus @default(SCHEDULED)

  // Stream tech
  streamKey       String           @unique @map("stream_key")
  streamUrl       String?          @map("stream_url")
  playbackUrl     String?          @map("playback_url")

  // Stats
  viewerCount     Int              @default(0) @map("viewer_count")
  peakViewers     Int              @default(0) @map("peak_viewers")
  likesCount      Int              @default(0) @map("likes_count")
  totalTipsKr     Decimal          @default(0) @map("total_tips_kr") @db.Decimal(18, 4)
  totalSalesKr    Decimal          @default(0) @map("total_sales_kr") @db.Decimal(18, 4)

  // Gift Goals
  giftGoalTitle   String?          @map("gift_goal_title")
  giftGoalTarget  Decimal?         @map("gift_goal_target") @db.Decimal(18, 4)
  giftGoalCurrent Decimal          @default(0) @map("gift_goal_current") @db.Decimal(18, 4)

  // Chama-exclusive
  chamaId         String?          @map("chama_id")

  // Contest Battle
  contestId       String?          @map("contest_id")

  // Proof of Task
  orderId         String?          @map("order_id")

  // Duet / Co-host
  isCoHostEnabled Boolean          @default(false) @map("is_co_host_enabled")
  maxCoHosts      Int              @default(1) @map("max_co_hosts")

  // Timestamps
  scheduledStart  DateTime?        @map("scheduled_start")
  actualStart     DateTime?        @map("actual_start")
  endedAt         DateTime?        @map("ended_at")
  createdAt       DateTime         @default(now()) @map("created_at")

  host            User             @relation("LiveHost", fields: [hostId], references: [id])
  coHosts         LiveCoHost[]
  viewers         LiveViewer[]
  messages        LiveMessage[]
  tips            LiveTip[]
  pinnedProducts  LivePinnedProduct[]
  bannedViewers   LiveBannedViewer[]
  battles         LiveBattle[]     @relation("LiveBattleStream")
  battleOpponent  LiveBattle[]     @relation("LiveBattleOpponent")

  @@index([status, createdAt])
  @@index([hostId, status])
  @@index([chamaId])
  @@map("live_streams")
}

model LiveCoHost {
  id           String    @id @default(uuid())
  streamId     String    @map("stream_id")
  userId       String    @map("user_id")
  joinedAt     DateTime  @default(now()) @map("joined_at")
  leftAt       DateTime? @map("left_at")

  stream LiveStream @relation(fields: [streamId], references: [id], onDelete: Cascade)

  @@unique([streamId, userId])
  @@map("live_co_hosts")
}

model LiveViewer {
  id           String    @id @default(uuid())
  streamId     String    @map("stream_id")
  userId       String    @map("user_id")
  joinedAt     DateTime  @default(now()) @map("joined_at")
  leftAt       DateTime? @map("left_at")
  totalTipsKr  Decimal   @default(0) @map("total_tips_kr") @db.Decimal(18, 4)
  likesGiven   Int       @default(0) @map("likes_given")

  stream LiveStream @relation(fields: [streamId], references: [id], onDelete: Cascade)

  @@unique([streamId, userId])
  @@index([streamId, totalTipsKr])
  @@map("live_viewers")
}

model LiveMessage {
  id           String   @id @default(uuid())
  streamId     String   @map("stream_id")
  userId       String   @map("user_id")
  text         String
  isSystem     Boolean  @default(false) @map("is_system")
  isPinned     Boolean  @default(false) @map("is_pinned")
  createdAt    DateTime @default(now()) @map("created_at")

  stream LiveStream @relation(fields: [streamId], references: [id], onDelete: Cascade)

  @@index([streamId, createdAt])
  @@map("live_messages")
}

model LiveTip {
  id           String   @id @default(uuid())
  streamId     String   @map("stream_id")
  senderId     String   @map("sender_id")
  recipientId  String   @map("recipient_id")
  amountKr     Decimal  @map("amount_kr") @db.Decimal(18, 4)
  giftType     String?  @map("gift_type")
  message      String?
  createdAt    DateTime @default(now()) @map("created_at")

  stream LiveStream @relation(fields: [streamId], references: [id], onDelete: Cascade)

  @@index([streamId, createdAt])
  @@index([streamId, senderId])
  @@map("live_tips")
}

model LivePinnedProduct {
  id           String    @id @default(uuid())
  streamId     String    @map("stream_id")
  productId    String    @map("product_id")
  salePrice    Decimal?  @map("sale_price") @db.Decimal(18, 4)
  isPinned     Boolean   @default(false) @map("is_pinned")
  pinnedAt     DateTime? @map("pinned_at")
  unitsSold    Int       @default(0) @map("units_sold")
  sortOrder    Int       @default(0) @map("sort_order")

  stream  LiveStream @relation(fields: [streamId], references: [id], onDelete: Cascade)
  product Product    @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([streamId, productId])
  @@map("live_pinned_products")
}

model LiveBannedViewer {
  id           String   @id @default(uuid())
  streamId     String   @map("stream_id")
  userId       String   @map("user_id")
  reason       String?
  bannedAt     DateTime @default(now()) @map("banned_at")

  stream LiveStream @relation(fields: [streamId], references: [id], onDelete: Cascade)

  @@unique([streamId, userId])
  @@map("live_banned_viewers")
}

// ─── PK BATTLES / CONTEST FACE-OFFS ─────────────────────

enum BattleStatus {
  PENDING
  ACTIVE
  COMPLETED
}

model LiveBattle {
  id               String       @id @default(uuid())
  streamId         String       @map("stream_id")
  opponentStreamId String       @map("opponent_stream_id")
  contestId        String?      @map("contest_id")
  durationSecs     Int          @default(300) @map("duration_secs")
  status           BattleStatus @default(PENDING)
  hostScore        Decimal      @default(0) @map("host_score") @db.Decimal(18, 4)
  opponentScore    Decimal      @default(0) @map("opponent_score") @db.Decimal(18, 4)
  winnerId         String?      @map("winner_id")
  startedAt        DateTime?    @map("started_at")
  endedAt          DateTime?    @map("ended_at")
  createdAt        DateTime     @default(now()) @map("created_at")

  stream         LiveStream @relation("LiveBattleStream", fields: [streamId], references: [id], onDelete: Cascade)
  opponentStream LiveStream @relation("LiveBattleOpponent", fields: [opponentStreamId], references: [id], onDelete: Cascade)

  @@map("live_battles")
}

// ─── VIDEO / VOICE CALLS ────────────────────────────────

enum CallType {
  VOICE
  VIDEO
}

enum CallStatus {
  RINGING
  ACTIVE
  ENDED
  MISSED
  DECLINED
}

model Call {
  id           String     @id @default(uuid())
  chatId       String     @map("chat_id")
  callerId     String     @map("caller_id")
  type         CallType
  status       CallStatus @default(RINGING)
  startedAt    DateTime?  @map("started_at")
  endedAt      DateTime?  @map("ended_at")
  durationSecs Int?       @map("duration_secs")
  createdAt    DateTime   @default(now()) @map("created_at")

  participants CallParticipant[]

  @@index([chatId, createdAt])
  @@index([callerId])
  @@map("calls")
}

model CallParticipant {
  id        String    @id @default(uuid())
  callId    String    @map("call_id")
  userId    String    @map("user_id")
  joinedAt  DateTime? @map("joined_at")
  leftAt    DateTime? @map("left_at")
  status    String    @default("invited") // invited, joined, declined, missed

  call Call @relation(fields: [callId], references: [id], onDelete: Cascade)

  @@unique([callId, userId])
  @@map("call_participants")
}'''

# Replace normalizer to handle exact lines
content = re.sub(r'// ─── LIVE SHOPPING ──────────────────────────────────────\s+model LiveSession \{[\s\S]+?@@map\("live_session_products"\)\n\}', new_models, content)

with open('c:/Users/ADMIN/Krieta/backend/prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)
