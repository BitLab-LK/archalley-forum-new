-- Check Session table usage and data
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Session' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any sessions stored
SELECT COUNT(*) as session_count FROM "Session";

-- Sample session data (if any exists)
SELECT 
  id,
  "sessionToken",
  "userId", 
  expires,
  expires < NOW() as is_expired
FROM "Session" 
ORDER BY expires DESC
LIMIT 5;