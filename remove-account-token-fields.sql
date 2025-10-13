-- ACCOUNT TABLE TOKEN FIELDS REMOVAL MIGRATION
-- Removes unused OAuth token fields while preserving all functionality

BEGIN;

-- Remove unused OAuth token fields from Account table
ALTER TABLE "Account" DROP COLUMN IF EXISTS "refresh_token";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "access_token";  
ALTER TABLE "Account" DROP COLUMN IF EXISTS "expires_at";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "token_type";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "scope";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "id_token";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "session_state";

COMMIT;

-- Verification queries (run after migration)
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'Account' ORDER BY ordinal_position;

-- Expected remaining columns:
-- id, userId, type, provider, providerAccountId