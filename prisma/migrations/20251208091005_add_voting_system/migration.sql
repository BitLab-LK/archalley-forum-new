/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `SubmissionVote` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `SubmissionVote` table. All the data in the column will be lost.
  - You are about to drop the column `submissionId` on the `SubmissionVote` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `SubmissionVote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registrationNumber]` on the table `CompetitionSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNumber,userId]` on the table `SubmissionVote` will be added. If there are existing duplicate values, this will fail.
  - Made the column `registrationNumber` on table `CompetitionSubmission` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `registrationNumber` to the `SubmissionVote` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `SubmissionVote` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."SubmissionVote" DROP CONSTRAINT "SubmissionVote_submissionId_fkey";

-- DropIndex
DROP INDEX "public"."SubmissionVote_ipAddress_idx";

-- DropIndex
DROP INDEX "public"."SubmissionVote_submissionId_idx";

-- DropIndex
DROP INDEX "public"."SubmissionVote_submissionId_ipAddress_key";

-- DropIndex
DROP INDEX "public"."SubmissionVote_submissionId_userId_key";

-- AlterTable
ALTER TABLE "CompetitionSubmission" ALTER COLUMN "registrationNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "SubmissionVote" DROP COLUMN "ipAddress",
DROP COLUMN "sessionId",
DROP COLUMN "submissionId",
DROP COLUMN "userAgent",
ADD COLUMN     "registrationNumber" TEXT NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionSubmission_registrationNumber_key" ON "CompetitionSubmission"("registrationNumber");

-- CreateIndex
CREATE INDEX "SubmissionVote_registrationNumber_idx" ON "SubmissionVote"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVote_registrationNumber_userId_key" ON "SubmissionVote"("registrationNumber", "userId");

-- AddForeignKey
ALTER TABLE "SubmissionVote" ADD CONSTRAINT "SubmissionVote_registrationNumber_fkey" FOREIGN KEY ("registrationNumber") REFERENCES "CompetitionSubmission"("registrationNumber") ON DELETE CASCADE ON UPDATE CASCADE;
