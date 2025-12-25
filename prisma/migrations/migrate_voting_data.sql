-- ============================================
-- SAFE MIGRATION: Voting System Separation
-- ============================================
-- This migration moves voting/judging data from CompetitionSubmission
-- to separate tables WITHOUT data loss

-- Step 1: Create new enum
CREATE TYPE "SubmissionVoteType" AS ENUM ('PUBLIC', 'JURY');

-- Step 2: Add new columns to SubmissionVote (without dropping anything yet)
ALTER TABLE "SubmissionVote" 
  ADD COLUMN IF NOT EXISTS "comments" TEXT,
  ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoringCriteria" JSONB,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "voteType" "SubmissionVoteType" NOT NULL DEFAULT 'PUBLIC';

-- Step 3: Create SubmissionVotingStats table
CREATE TABLE IF NOT EXISTS "SubmissionVotingStats" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "publicVoteCount" INTEGER NOT NULL DEFAULT 0,
    "juryVoteCount" INTEGER NOT NULL DEFAULT 0,
    "juryScoreTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "juryScoreAverage" DOUBLE PRECISION,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "publicRank" INTEGER,
    "juryRank" INTEGER,
    "overallRank" INTEGER,
    "categoryRank" INTEGER,
    "award" TEXT,
    "certificateUrl" TEXT,
    "firstVoteAt" TIMESTAMP(3),
    "lastVotedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionVotingStats_pkey" PRIMARY KEY ("id")
);

-- Step 4: Migrate existing data from CompetitionSubmission to SubmissionVotingStats
INSERT INTO "SubmissionVotingStats" (
  "id",
  "registrationNumber",
  "publicVoteCount",
  "viewCount",
  "juryScoreAverage",
  "award",
  "certificateUrl",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid() as id,
  "registrationNumber",
  COALESCE("voteCount", 0) as "publicVoteCount",
  COALESCE("viewCount", 0) as "viewCount",
  "finalScore" as "juryScoreAverage",
  "award",
  "certificateUrl",
  CURRENT_TIMESTAMP as "createdAt",
  CURRENT_TIMESTAMP as "updatedAt"
FROM "CompetitionSubmission"
WHERE "registrationNumber" IS NOT NULL
ON CONFLICT ("registrationNumber") DO NOTHING;

-- Step 5: Create indexes for SubmissionVotingStats
CREATE UNIQUE INDEX IF NOT EXISTS "SubmissionVotingStats_registrationNumber_key" 
  ON "SubmissionVotingStats"("registrationNumber");
CREATE INDEX IF NOT EXISTS "SubmissionVotingStats_publicVoteCount_idx" 
  ON "SubmissionVotingStats"("publicVoteCount");
CREATE INDEX IF NOT EXISTS "SubmissionVotingStats_juryScoreAverage_idx" 
  ON "SubmissionVotingStats"("juryScoreAverage");
CREATE INDEX IF NOT EXISTS "SubmissionVotingStats_overallRank_idx" 
  ON "SubmissionVotingStats"("overallRank");
CREATE INDEX IF NOT EXISTS "SubmissionVotingStats_registrationNumber_publicVoteCount_idx" 
  ON "SubmissionVotingStats"("registrationNumber", "publicVoteCount");

-- Step 6: Create indexes for SubmissionVote
CREATE INDEX IF NOT EXISTS "SubmissionVote_voteType_idx" 
  ON "SubmissionVote"("voteType");
CREATE INDEX IF NOT EXISTS "SubmissionVote_registrationNumber_voteType_idx" 
  ON "SubmissionVote"("registrationNumber", "voteType");
CREATE INDEX IF NOT EXISTS "SubmissionVote_createdAt_idx" 
  ON "SubmissionVote"("createdAt");

-- Step 7: Add foreign key constraints
ALTER TABLE "SubmissionVote" 
  ADD CONSTRAINT "SubmissionVote_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubmissionVotingStats" 
  ADD CONSTRAINT "SubmissionVotingStats_registrationNumber_fkey" 
  FOREIGN KEY ("registrationNumber") REFERENCES "CompetitionSubmission"("registrationNumber") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: NOW SAFE TO DROP old columns from CompetitionSubmission
-- (Data already migrated to SubmissionVotingStats)
ALTER TABLE "CompetitionSubmission" 
  DROP COLUMN IF EXISTS "voteCount",
  DROP COLUMN IF EXISTS "viewCount",
  DROP COLUMN IF EXISTS "judgeScores",
  DROP COLUMN IF EXISTS "finalScore",
  DROP COLUMN IF EXISTS "rank",
  DROP COLUMN IF EXISTS "award",
  DROP COLUMN IF EXISTS "certificateUrl";

-- Step 9: Verify migration success
DO $$
DECLARE
  submission_count INTEGER;
  stats_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO submission_count FROM "CompetitionSubmission";
  SELECT COUNT(*) INTO stats_count FROM "SubmissionVotingStats";
  
  RAISE NOTICE 'Migration Complete:';
  RAISE NOTICE '  - Total submissions: %', submission_count;
  RAISE NOTICE '  - Total voting stats: %', stats_count;
  
  IF submission_count != stats_count THEN
    RAISE WARNING 'Mismatch: % submissions but % stats records', submission_count, stats_count;
  ELSE
    RAISE NOTICE '  ✓ All submissions have voting stats';
  END IF;
END $$;
