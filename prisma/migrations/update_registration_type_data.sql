-- Update CompetitionRegistrationType data to correct values
-- This fixes maxMembers and age restrictions

-- Fix TEAM maxMembers (should allow up to 10 members)
UPDATE "CompetitionRegistrationType"
SET "maxMembers" = 10, "updatedAt" = NOW()
WHERE type = 'TEAM';

-- Fix COMPANY maxMembers (should be 1 representative only)
UPDATE "CompetitionRegistrationType"
SET "maxMembers" = 1, "updatedAt" = NOW()
WHERE type = 'COMPANY';

-- Add STUDENT age restriction (students under 25)
UPDATE "CompetitionRegistrationType"
SET "maxAge" = 25, "updatedAt" = NOW()
WHERE type = 'STUDENT';

-- Update KIDS description and maxAge (below 12 means up to 11)
UPDATE "CompetitionRegistrationType"
SET "maxAge" = 15, "updatedAt" = NOW()
WHERE type = 'KIDS';

-- Verify updates
SELECT 
  type,
  name,
  "maxMembers",
  "minAge",
  "maxAge",
  fee
FROM "CompetitionRegistrationType"
ORDER BY "displayOrder";
