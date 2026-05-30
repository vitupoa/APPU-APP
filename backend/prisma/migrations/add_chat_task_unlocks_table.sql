-- Migration: Add chat_task_unlocks table for task-based locked chat access
-- Requirements: 2.6.1 - Task-Based Locked Chat
-- Date: 2025-01-XX

-- Create ChatTaskStatus enum
CREATE TYPE "ChatTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- Create chat_task_unlocks table
CREATE TABLE "chat_task_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "task_description" TEXT NOT NULL,
    "status" "ChatTaskStatus" NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3) NOT NULL,
    "deliverable_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "chat_task_unlocks_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "chat_task_unlocks_creator_id_idx" ON "chat_task_unlocks"("creator_id");
CREATE INDEX "chat_task_unlocks_user_id_idx" ON "chat_task_unlocks"("user_id");
CREATE INDEX "chat_task_unlocks_status_idx" ON "chat_task_unlocks"("status");
CREATE INDEX "chat_task_unlocks_user_id_creator_id_idx" ON "chat_task_unlocks"("user_id", "creator_id");

-- Add comments for documentation
COMMENT ON TABLE "chat_task_unlocks" IS 'Task-based chat access unlocks - users pay to unlock chat for specific tasks';
COMMENT ON COLUMN "chat_task_unlocks"."task_description" IS 'User-provided description of what they want the creator to do';
COMMENT ON COLUMN "chat_task_unlocks"."status" IS 'Task status: PENDING (just paid), IN_PROGRESS (creator working), COMPLETED (done), EXPIRED (deadline passed)';
COMMENT ON COLUMN "chat_task_unlocks"."deadline" IS 'When the task should be completed by';
COMMENT ON COLUMN "chat_task_unlocks"."deliverable_url" IS 'URL to the creator''s delivery (video, file, etc.)';
