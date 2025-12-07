-- CreateEnum
CREATE TYPE "Ga4PurchaseStatus" AS ENUM ('NOT_SENT', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "Ga4PurchaseLogStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "CompetitionPayment" ADD COLUMN     "ga4PurchaseError" TEXT,
ADD COLUMN     "ga4PurchaseLastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "ga4PurchaseResponse" JSONB,
ADD COLUMN     "ga4PurchaseSentAt" TIMESTAMP(3),
ADD COLUMN     "ga4PurchaseStatus" "Ga4PurchaseStatus" NOT NULL DEFAULT 'NOT_SENT';

-- CreateTable
CREATE TABLE "Ga4PurchaseLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentId" TEXT,
    "paymentMethod" TEXT,
    "source" TEXT,
    "status" "Ga4PurchaseLogStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB,
    "response" JSONB,
    "errorMessage" TEXT,
    "httpStatus" INTEGER,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ga4PurchaseLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ga4PurchaseLog_transactionId_idx" ON "Ga4PurchaseLog"("transactionId");

-- CreateIndex
CREATE INDEX "Ga4PurchaseLog_paymentId_idx" ON "Ga4PurchaseLog"("paymentId");

-- CreateIndex
CREATE INDEX "Ga4PurchaseLog_status_idx" ON "Ga4PurchaseLog"("status");

-- CreateIndex
CREATE INDEX "CompetitionPayment_ga4PurchaseStatus_idx" ON "CompetitionPayment"("ga4PurchaseStatus");

-- AddForeignKey
ALTER TABLE "Ga4PurchaseLog" ADD CONSTRAINT "Ga4PurchaseLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CompetitionPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
