-- CreateEnum
CREATE TYPE "SubmissionCategory" AS ENUM ('DIGITAL', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "CompetitionSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VALIDATED', 'PUBLISHED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "CompetitionSubmission" (
    "id" TEXT NOT NULL,
    "submissionNumber" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "submissionCategory" "SubmissionCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keyPhotographUrl" TEXT NOT NULL,
    "additionalPhotographs" TEXT[],
    "documentFileUrl" TEXT,
    "videoFileUrl" TEXT,
    "fileMetadata" JSONB,
    "status" "CompetitionSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" JSONB,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validationNotes" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "judgeScores" JSONB,
    "finalScore" DOUBLE PRECISION,
    "rank" INTEGER,
    "award" TEXT,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionVote" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionSubmission_submissionNumber_key" ON "CompetitionSubmission"("submissionNumber");

-- CreateIndex
CREATE INDEX "CompetitionSubmission_registrationId_idx" ON "CompetitionSubmission"("registrationId");

-- CreateIndex
CREATE INDEX "CompetitionSubmission_userId_idx" ON "CompetitionSubmission"("userId");

-- CreateIndex
CREATE INDEX "CompetitionSubmission_competitionId_idx" ON "CompetitionSubmission"("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionSubmission_submissionCategory_idx" ON "CompetitionSubmission"("submissionCategory");

-- CreateIndex
CREATE INDEX "CompetitionSubmission_status_idx" ON "CompetitionSubmission"("status");

-- CreateIndex
CREATE INDEX "CompetitionSubmission_isPublished_idx" ON "CompetitionSubmission"("isPublished");

-- CreateIndex
CREATE INDEX "CompetitionSubmission_competitionId_submissionCategory_idx" ON "CompetitionSubmission"("competitionId", "submissionCategory");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionSubmission_registrationId_key" ON "CompetitionSubmission"("registrationId");

-- CreateIndex
CREATE INDEX "SubmissionVote_submissionId_idx" ON "SubmissionVote"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionVote_userId_idx" ON "SubmissionVote"("userId");

-- CreateIndex
CREATE INDEX "SubmissionVote_ipAddress_idx" ON "SubmissionVote"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVote_submissionId_userId_key" ON "SubmissionVote"("submissionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVote_submissionId_ipAddress_key" ON "SubmissionVote"("submissionId", "ipAddress");

-- AddForeignKey
ALTER TABLE "SubmissionVote" ADD CONSTRAINT "SubmissionVote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CompetitionSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
