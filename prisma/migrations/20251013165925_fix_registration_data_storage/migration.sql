/*
  Warnings:

  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `users` table. All the data in the column will be lost.

*/
-- Migration: Fix registration data storage issues
-- This migration consolidates duplicate fields and adds missing portfolio links

-- Step 1: Migrate phone data to phoneNumber (preserve existing data)
UPDATE "users" SET "phoneNumber" = "phone" WHERE "phoneNumber" IS NULL AND "phone" IS NOT NULL;

-- Step 2: Migrate website data to portfolioUrl (preserve existing data)  
UPDATE "users" SET "portfolioUrl" = "website" WHERE "portfolioUrl" IS NULL AND "website" IS NOT NULL;

-- Step 3: Add portfolioLinks array field
ALTER TABLE "users" ADD COLUMN "portfolioLinks" TEXT[] DEFAULT '{}';

-- Step 4: Drop duplicate fields
ALTER TABLE "users" DROP COLUMN "phone";
ALTER TABLE "users" DROP COLUMN "website";