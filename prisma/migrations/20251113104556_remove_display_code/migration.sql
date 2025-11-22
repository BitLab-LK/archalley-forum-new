/*
  Warnings:

  - You are about to drop the column `displayCode` on the `CompetitionRegistration` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."CompetitionRegistration_displayCode_idx";

-- DropIndex
DROP INDEX "public"."CompetitionRegistration_displayCode_key";

-- AlterTable
ALTER TABLE "CompetitionRegistration" DROP COLUMN "displayCode";
