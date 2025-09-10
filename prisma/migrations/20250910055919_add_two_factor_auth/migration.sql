-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "EmailDigestFreq" AS ENUM ('DISABLED', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'EMAIL_VERIFICATION';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_POST_IN_CATEGORY';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_FOLLOWER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailDigest" "EmailDigestFreq" NOT NULL DEFAULT 'DISABLED',
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnComment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnLike" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnMention" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnNewPost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyOnReply" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnSystem" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "EmailLogs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "userId" TEXT,
    "postId" TEXT,
    "commentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLogs_email_idx" ON "EmailLogs"("email");

-- CreateIndex
CREATE INDEX "EmailLogs_userId_idx" ON "EmailLogs"("userId");

-- CreateIndex
CREATE INDEX "EmailLogs_type_idx" ON "EmailLogs"("type");

-- CreateIndex
CREATE INDEX "EmailLogs_status_idx" ON "EmailLogs"("status");
