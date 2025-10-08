/*
  Warnings:

  - You are about to drop the `attachments` table. If the table is not empty, all the data it contains will be lost.

*/

-- First, transfer existing attachment URLs to the Post.images field
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

-- Now drop the attachments table
-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_postId_fkey";

-- DropTable
DROP TABLE "attachments";
