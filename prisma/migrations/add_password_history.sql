-- Migration: Add password history table
-- This migration adds a password history table to track previous passwords
-- and prevent users from reusing their last 5 passwords

CREATE TABLE IF NOT EXISTS "PasswordHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- Create index on userId for faster lookups
CREATE INDEX IF NOT EXISTS "PasswordHistory_userId_idx" ON "PasswordHistory"("userId");

-- Create index on createdAt for cleanup operations
CREATE INDEX IF NOT EXISTS "PasswordHistory_createdAt_idx" ON "PasswordHistory"("createdAt");

-- Add foreign key constraint
ALTER TABLE "PasswordHistory" 
ADD CONSTRAINT "PasswordHistory_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
