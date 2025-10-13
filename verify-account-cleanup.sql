-- Verify the Account table structure after token field removal
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Account' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected columns:
-- id (text, NO)
-- userId (text, NO) 
-- type (text, NO)
-- provider (text, NO)
-- providerAccountId (text, NO)

-- Check existing accounts still work
SELECT 
  id,
  provider,
  type,
  "userId"
FROM "Account" 
LIMIT 5;