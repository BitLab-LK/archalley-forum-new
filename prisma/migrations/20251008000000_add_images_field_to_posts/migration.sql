-- Add images array field to Post table
ALTER TABLE "Post" ADD COLUMN "images" TEXT[] DEFAULT '{}';

-- Migrate existing attachment URLs to the new images field
UPDATE "Post" 
SET "images" = (
  SELECT ARRAY_AGG("url" ORDER BY "createdAt")
  FROM "attachments" 
  WHERE "attachments"."postId" = "Post"."id"
)
WHERE EXISTS (
  SELECT 1 FROM "attachments" WHERE "attachments"."postId" = "Post"."id"
);

-- Ensure posts without attachments have empty array (should already be default)
UPDATE "Post" SET "images" = '{}' WHERE "images" IS NULL;