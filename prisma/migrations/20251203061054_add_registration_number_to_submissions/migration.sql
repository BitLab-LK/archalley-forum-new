-- AlterTable
ALTER TABLE "CompetitionSubmission" ADD COLUMN     "registrationNumber" TEXT;

-- CreateIndex
CREATE INDEX "CompetitionSubmission_registrationNumber_idx" ON "CompetitionSubmission"("registrationNumber");
