/*
  Warnings:

  - A unique constraint covering the columns `[displayCode]` on the table `CompetitionRegistration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CompetitionRegistration" ADD COLUMN     "displayCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_displayCode_key" ON "CompetitionRegistration"("displayCode");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_displayCode_idx" ON "CompetitionRegistration"("displayCode");
