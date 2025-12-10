/*
  Warnings:

  - You are about to drop the column `award` on the `CompetitionSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `certificateUrl` on the `CompetitionSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `finalScore` on the `CompetitionSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `judgeScores` on the `CompetitionSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `CompetitionSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `CompetitionSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `voteCount` on the `CompetitionSubmission` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubmissionVoteType" AS ENUM ('PUBLIC', 'JURY');

-- AlterTable
ALTER TABLE "CompetitionSubmission" DROP COLUMN "award",
DROP COLUMN "certificateUrl",
DROP COLUMN "finalScore",
DROP COLUMN "judgeScores",
DROP COLUMN "rank",
DROP COLUMN "viewCount",
DROP COLUMN "voteCount";

-- AlterTable
ALTER TABLE "SubmissionVote" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "scoringCriteria" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "voteType" "SubmissionVoteType" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "SubmissionVotingStats" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionVotingStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVotingStats_registrationNumber_key" ON "SubmissionVotingStats"("registrationNumber");

-- CreateIndex
CREATE INDEX "SubmissionVotingStats_publicVoteCount_idx" ON "SubmissionVotingStats"("publicVoteCount");

-- CreateIndex
CREATE INDEX "SubmissionVotingStats_juryScoreAverage_idx" ON "SubmissionVotingStats"("juryScoreAverage");

-- CreateIndex
CREATE INDEX "SubmissionVotingStats_overallRank_idx" ON "SubmissionVotingStats"("overallRank");

-- CreateIndex
CREATE INDEX "SubmissionVotingStats_registrationNumber_publicVoteCount_idx" ON "SubmissionVotingStats"("registrationNumber", "publicVoteCount");

-- CreateIndex
CREATE INDEX "SubmissionVote_voteType_idx" ON "SubmissionVote"("voteType");

-- CreateIndex
CREATE INDEX "SubmissionVote_registrationNumber_voteType_idx" ON "SubmissionVote"("registrationNumber", "voteType");

-- CreateIndex
CREATE INDEX "SubmissionVote_createdAt_idx" ON "SubmissionVote"("createdAt");

-- AddForeignKey
ALTER TABLE "SubmissionVote" ADD CONSTRAINT "SubmissionVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionVotingStats" ADD CONSTRAINT "SubmissionVotingStats_registrationNumber_fkey" FOREIGN KEY ("registrationNumber") REFERENCES "CompetitionSubmission"("registrationNumber") ON DELETE CASCADE ON UPDATE CASCADE;
