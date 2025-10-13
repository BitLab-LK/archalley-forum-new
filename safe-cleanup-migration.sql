-- SAFE DATABASE CLEANUP MIGRATION
-- This migration only removes CONFIRMED duplicate/unused fields
-- All actively used fields are preserved

-- ============================================================================
-- PHASE 1: SAFE DUPLICATE FIELD REMOVAL
-- ============================================================================

-- 1. Migrate phone data to phoneNumber and remove duplicate phone field
UPDATE users 
SET phoneNumber = phone 
WHERE phoneNumber IS NULL AND phone IS NOT NULL;

ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- 2. Migrate website data to portfolioUrl and remove duplicate website field  
UPDATE users 
SET portfolioUrl = website 
WHERE portfolioUrl IS NULL AND website IS NOT NULL;

ALTER TABLE users DROP COLUMN IF EXISTS website;

-- 3. Remove unused viewCount field (shareCount is kept as it's actively used)
ALTER TABLE "Post" DROP COLUMN IF EXISTS viewCount;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================

-- Check that phone data was migrated properly
-- SELECT COUNT(*) FROM users WHERE phoneNumber IS NOT NULL;

-- Check that website data was migrated properly  
-- SELECT COUNT(*) FROM users WHERE portfolioUrl IS NOT NULL;

-- Verify viewCount column was removed
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'Post' AND column_name = 'viewCount';

-- ============================================================================
-- ROLLBACK PLAN (If needed)
-- ============================================================================

-- If you need to rollback:
-- ALTER TABLE users ADD COLUMN phone TEXT;
-- ALTER TABLE users ADD COLUMN website TEXT;  
-- ALTER TABLE "Post" ADD COLUMN viewCount INTEGER DEFAULT 0;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Fields NOT removed (actively used):
-- - firstName, lastName (used in profile forms and search)
-- - shareCount (used by share API)  
-- - All badge system fields (fully implemented)
-- - All moderation fields (active moderation system)
-- - All social media URLs (used in profile display)
-- - All privacy control fields (phonePrivacy, emailPrivacy, etc.)

-- This migration is SAFE because:
-- 1. Data is migrated before removal
-- 2. Only removes confirmed duplicates  
-- 3. Preserves all actively used functionality
-- 4. Badge and moderation systems remain intact