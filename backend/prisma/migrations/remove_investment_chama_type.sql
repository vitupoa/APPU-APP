-- Migration: Remove INVESTMENT chama type (Wave 1 Task 9.1)
-- This migration removes the INVESTMENT type from ChamaType enum
-- and migrates existing INVESTMENT chamas to WELFARE type

-- Step 1: Update existing INVESTMENT chamas to WELFARE
UPDATE "Chama" 
SET chama_type = 'WELFARE' 
WHERE chama_type = 'INVESTMENT';

-- Step 2: Alter enum to remove INVESTMENT type
-- Note: PostgreSQL doesn't support direct enum value removal
-- We need to create a new enum and migrate

-- Create new enum without INVESTMENT
CREATE TYPE "ChamaType_new" AS ENUM ('MERRY_GO_ROUND', 'WELFARE');

-- Update column to use new enum
ALTER TABLE "Chama" 
  ALTER COLUMN chama_type TYPE "ChamaType_new" 
  USING chama_type::text::"ChamaType_new";

-- Drop old enum
DROP TYPE "ChamaType";

-- Rename new enum to original name
ALTER TYPE "ChamaType_new" RENAME TO "ChamaType";
