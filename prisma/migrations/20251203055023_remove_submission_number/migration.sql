/*
  Warnings:

  - You are about to drop the column `submissionNumber` on the `CompetitionSubmission` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."CompetitionSubmission_submissionNumber_key";

-- AlterTable
ALTER TABLE "CompetitionSubmission" DROP COLUMN "submissionNumber";
