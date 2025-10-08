-- Remove post titles migration
-- This migration removes the title field from the Post table

-- Remove the title column from Post table
ALTER TABLE "Post" DROP COLUMN IF EXISTS "title";