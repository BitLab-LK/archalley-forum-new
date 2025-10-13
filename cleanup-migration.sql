-- Database Cleanup Migration Script
-- Remove redundant and unused fields

-- 1. Remove duplicate phone field (keep phoneNumber)
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone";

-- 2. Remove duplicate website field (keep portfolioUrl)  
ALTER TABLE "users" DROP COLUMN IF EXISTS "website";

-- 3. Remove unused social media fields
ALTER TABLE "users" DROP COLUMN IF EXISTS "behanceUrl";
ALTER TABLE "users" DROP COLUMN IF EXISTS "dribbbleUrl";
ALTER TABLE "users" DROP COLUMN IF EXISTS "tiktokUrl";
ALTER TABLE "users" DROP COLUMN IF EXISTS "otherSocialUrl";

-- 4. Remove name duplication fields
ALTER TABLE "users" DROP COLUMN IF EXISTS "firstName";
ALTER TABLE "users" DROP COLUMN IF EXISTS "lastName";

-- 5. Remove unused engagement tracking
ALTER TABLE "Post" DROP COLUMN IF EXISTS "viewCount";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "shareCount";

-- 6. Remove redundant category array (keep relations)
ALTER TABLE "Post" DROP COLUMN IF EXISTS "categoryIds";

-- 7. Consider consolidating AI fields into JSON
-- ALTER TABLE "Post" ADD COLUMN "aiMetadata" JSONB;
-- Then migrate aiTags, translatedContent, originalLanguage into this JSON field