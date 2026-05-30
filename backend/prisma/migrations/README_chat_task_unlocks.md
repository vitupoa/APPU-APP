# Chat Task Unlocks Migration

## Overview
This migration adds the `chat_task_unlocks` table to support task-based locked chat access, implementing requirement 2.6.1 from the wallet compliance restructuring spec.

## Business Context
Creators can offer task-based services (similar to Cameo/Fiverr) where users pay to unlock a chat for a specific task. Once the task is complete, the chat locks again unless the user is a subscriber.

## Schema Changes

### New Table: `chat_task_unlocks`
Tracks individual task-based chat unlocks between users and creators.

**Columns:**
- `id` (TEXT, PK): Unique identifier
- `user_id` (TEXT): User who paid to unlock chat
- `creator_id` (TEXT): Creator providing the service
- `amount_kr` (DECIMAL): Amount paid in Kr
- `task_description` (TEXT): What the user wants the creator to do
- `status` (ChatTaskStatus): Current task status
- `deadline` (TIMESTAMP): When task should be completed
- `deliverable_url` (TEXT, nullable): URL to creator's delivery
- `created_at` (TIMESTAMP): When task was created
- `completed_at` (TIMESTAMP, nullable): When task was marked complete

### New Enum: `ChatTaskStatus`
- `PENDING`: Task just created, waiting for creator to start
- `IN_PROGRESS`: Creator is working on the task
- `COMPLETED`: Task is done, chat will lock again
- `EXPIRED`: Deadline passed without completion

### Indexes
- `creator_id`: Find all tasks for a creator
- `user_id`: Find all tasks for a user
- `status`: Filter by task status
- `user_id, creator_id`: Check if user has active task with creator

## Access Rules

### Chat Access Logic
1. **Subscribers**: Always have access (no task needed)
2. **Active Task**: User can message if they have a task with status PENDING or IN_PROGRESS
3. **Locked**: If creator enabled locked chat and user has no active task, must pay to unlock
4. **Unlocked**: If creator hasn't enabled locked chat, anyone can message

### Task Lifecycle
```
User pays → PENDING → Creator accepts → IN_PROGRESS → Creator delivers → COMPLETED → Chat locks
                                                    ↓
                                              Deadline passes → EXPIRED → Chat locks
```

## Related Tables
- `locked_chat_settings`: Per-creator settings (already exists)
  - `is_locked`: Whether creator has locked chat enabled
  - `task_fee_kr`: Fee per task
  - `typical_delivery_time`: Expected delivery time

## Migration File
`add_chat_task_unlocks_table.sql`

## How to Apply

### Development
```bash
# Apply migration manually
psql $DATABASE_URL -f prisma/migrations/add_chat_task_unlocks_table.sql

# Or use Prisma
npx prisma db push
```

### Production
```bash
# Apply migration
psql $DATABASE_URL -f prisma/migrations/add_chat_task_unlocks_table.sql

# Verify
psql $DATABASE_URL -c "\d chat_task_unlocks"
```

## Rollback
```sql
-- Drop table and enum
DROP TABLE IF EXISTS "chat_task_unlocks";
DROP TYPE IF EXISTS "ChatTaskStatus";
```

## Testing Checklist
- [ ] User can pay to unlock chat for a task
- [ ] Chat is accessible while task is PENDING or IN_PROGRESS
- [ ] Chat locks after task is COMPLETED or EXPIRED
- [ ] Subscribers can always message (bypass task requirement)
- [ ] Creator can mark task as IN_PROGRESS
- [ ] Creator can mark task as COMPLETED with deliverable
- [ ] Tasks expire after deadline
- [ ] Indexes improve query performance

## Related Requirements
- **2.6.1**: Task-Based Locked Chat
- **2.2.1**: Mandatory Transaction Context (LOCKED_CHAT_TASK type)

## Notes
- This is a **zero-budget MVP** feature
- No refunds once task is created
- Chat access is temporary (per task)
- Subscribers bypass this system entirely
