-- Check VerificationToken table usage and data
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'VerificationToken' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any verification tokens stored
SELECT COUNT(*) as token_count FROM "VerificationToken";

-- Sample verification token data (if any exists)
SELECT 
  id,
  identifier,
  token,
  expires,
  expires < NOW() as is_expired
FROM "VerificationToken" 
ORDER BY expires DESC
LIMIT 5;