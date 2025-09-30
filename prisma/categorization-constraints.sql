
-- Migration: Add categorization constraints and optimizations
-- File: prisma/migrations/xxx_categorization_optimization/migration.sql

-- Add check constraint to ensure categoryId matches categoryIds[0]
-- Note: PostgreSQL array indexing is 1-based
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_matches_first" 
CHECK ("categoryId" = "categoryIds"[1]);

-- Add constraint to ensure categoryIds is not empty
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryIds_not_empty" 
CHECK (array_length("categoryIds", 1) > 0);

-- Add constraint to limit maximum categories
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryIds_max_length" 
CHECK (array_length("categoryIds", 1) <= 4);

-- Create index for better categorization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Post_categoryIds_gin" ON "Post" USING GIN ("categoryIds");

-- Add comment for documentation
COMMENT ON COLUMN "Post"."categoryId" IS 'Primary category for relation - must match categoryIds[0]';
COMMENT ON COLUMN "Post"."categoryIds" IS 'All assigned categories - primary categorization field';
COMMENT ON COLUMN "Post"."aiCategory" IS 'DEPRECATED: Legacy AI category field';
COMMENT ON COLUMN "Post"."aiCategories" IS 'DEPRECATED: Legacy AI categories field';
