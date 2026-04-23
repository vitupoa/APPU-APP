# Krieta Chat & Chama Module Implementation Plan

## 🎯 Overview
This document outlines the architecture and phased delivery of the core messaging system, stories, group-based financial systems (Chamas), personal budgeting, and advanced End-to-End Encryption (E2EE) for Krieta.

---

## 📅 Phasing Strategy

### **Phase 1: Core 1-on-1 & Group Chat (Foundation)**
*   **Database Schema:** `Chat`, `ChatParticipant`, `Message`, `MessageStatus`
*   **Backend:** REST APIs for chat creation, message history pagination, and WebSocket gateway integration for real-time delivery.
*   **Frontend (Compose Multiplatform):** 
    *   Add `Chats` tab to the Bottom Navigation Bar (Home, Explore, +, Drips, Chats, Profile).
    *   `ChatListScreen`: Show active conversations with unread badges.
    *   `ChatRoomScreen`: Real-time message UI (ViewModel + Repository architecture).
    *   *Offline Support*: SQLite (Room) local caching for message queueing.
    *   *Tipping*: Integration of existing `WalletService.sendTip()` within direct chats.

### **Phase 2: Stories System (Ephemerality)**
*   **Database Schema:** `Story`, `StoryView`, `StoryViewerPreference`
*   **Backend:** 
    *   Cloudinary upload endpoints with auto-delete TTL parameters.
    *   Privacy tier logic (Public, Lovers, Admirers, Specific Users).
    *   View tracking and tipping integration for stories.
*   **Frontend:** Horizontal stories bar above the Chat List, Story Viewer UI, Media/Text story creator.

### **Phase 3: Chama Integration (Social Finance)**
*   **Database Schema:** `Chama`, `ChamaWallet`, `ChamaMember`, `ChamaTransaction`, `ChamaVote`
*   **Backend:** 
    *   Smart contract-like logic for Rotating, Investment, Welfare, and Hybrid chamas.
    *   Wallet integrations: Convert M-Pesa/Bank to Kr on deposit, Kr to fiat on withdrawal.
    *   Role-based access control (Chair, Treasurer, Secretary) for approvals.
*   **Frontend:** In-chat Chama widgets, Chama Dashboard (Vault, Schedule, Analytics, Voting).

### **Phase 4: Budgeting Feature (Standalone Personal Finance)**
*   **Database Schema:** `Budget`, `BudgetCategory`, `Expense`
*   **Backend:** CRUD for budgets, spending analytics, recurring expense trackers.
*   **Frontend:** Visual progress bars, receipt scanning stub, overspending alerts dashboard.

### **Phase 5: Advanced Security (E2EE via libsignal)**
*   **Database Schema:** `DeviceKey`, `PreKeyBundle`, `SignedPreKey`
*   **Backend:** Key distribution server logic (server blindly stores and serves public keys).
*   **Frontend:** `libsignal` bindings for KMP, double-ratchet implementation, disappearing messages logic, screenshot detection.

---

## 🗄️ Phase 1 Database Schema (Prisma)

```prisma
enum ChatType {
  DIRECT
  GROUP
}

model Chat {
  id          String   @id @default(uuid())
  type        ChatType
  name        String?  // Null for DIRECT
  description String?
  avatarUrl   String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  participants ChatParticipant[]
  messages     Message[]
  chama        Chama?           // For Phase 3

  @@map("chats")
}

model ChatParticipant {
  id        String   @id @default(uuid())
  chatId    String   @map("chat_id")
  userId    String   @map("user_id")
  role      String   @default("member") // admin, member
  joinedAt  DateTime @default(now()) @map("joined_at")
  lastRead  DateTime @default(now()) @map("last_read")

  chat Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([chatId, userId])
  @@map("chat_participants")
}

model Message {
  id             String   @id @default(uuid())
  chatId         String   @map("chat_id")
  senderId       String   @map("sender_id")
  payload        String   // Encrypted payload (or plain text in Phase 1 before E2EE)
  mediaUrl       String?  @map("media_url")
  mediaType      String?  @map("media_type") // image, video, document, voice
  isSystemEvent  Boolean  @default(false) @map("is_system_event") // For "User joined", "Chama created"
  status         String   @default("sent") // sent, delivered, read
  replyToId      String?  @map("reply_to_id")
  createdAt      DateTime @default(now()) @map("created_at")

  chat    Chat      @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender  User      @relation(fields: [senderId], references: [id], onDelete: Cascade)
  replyTo Message?  @relation("MessageReplies", fields: [replyToId], references: [id], onDelete: SetNull)
  replies Message[] @relation("MessageReplies")

  @@index([chatId, createdAt])
  @@map("messages")
}
```

---

## 🔌 WebSockets & API (Phase 1)

**Events (Socket.io):**
*   `chat:send_message` -> Server broadcasts `chat:new_message` to participants.
*   `chat:typing` -> Broadcasts typing indicator.
*   `chat:read_receipt` -> Updates message state to double-yellow ticks.

---

## 📱 Mobile Architecture (Phase 1)
1. **Module Structure:** Create `composeApp/src/commonMain/kotlin/com/krieta/feature/chat`
2. **Navigation:** Update `BottomNavigationBar.kt` to handle 6 elements natively (or a + FAB overlay).
3. **Local DB:** Use Room Database for `LocalMessage` caching to allow offline queueing.
4. **UI States:** `ChatListViewModel` and `ChatRoomViewModel`.

## ✅ Next Steps
Once confirmed, we will initiate **Phase 1** natively, starting with the Prisma Schema updates, backend API & Socket controllers, and finally building the mobile UI modules.
