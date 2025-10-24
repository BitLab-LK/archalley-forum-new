/*
  Warnings:

  - You are about to drop the column `aiCategories` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `aiCategory` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the `flags` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'COPYRIGHT_VIOLATION', 'PERSONAL_INFORMATION', 'OFF_TOPIC', 'DUPLICATE_CONTENT', 'SCAM_FRAUD', 'VIOLENCE_THREATS', 'SEXUAL_CONTENT', 'ILLEGAL_CONTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('APPROVE_POST', 'REJECT_POST', 'HIDE_POST', 'UNHIDE_POST', 'PIN_POST', 'UNPIN_POST', 'LOCK_POST', 'UNLOCK_POST', 'DELETE_POST', 'RESTORE_POST', 'EDIT_POST', 'APPROVE_FLAG', 'DISMISS_FLAG', 'ESCALATE_FLAG', 'WARN_USER', 'SUSPEND_USER', 'UNSUSPEND_USER', 'BAN_USER', 'UNBAN_USER', 'AUTO_MODERATE', 'BULK_ACTION');

-- AlterEnum
ALTER TYPE "FlagStatus" ADD VALUE 'ESCALATED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MODERATION_ACTION';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "flags" DROP CONSTRAINT "flags_userId_fkey";

-- DropIndex
DROP INDEX "Post_categoryId_idx";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "aiCategories",
DROP COLUMN "aiCategory",
DROP COLUMN "categoryId",
ADD COLUMN     "aiSuggestions" JSONB,
ADD COLUMN     "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "flagCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastModeratedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedBy" TEXT,
ADD COLUMN     "moderationNotes" TEXT,
ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "primaryCategoryId" TEXT;

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "description",
DROP COLUMN "icon";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedBy" TEXT,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationNotes" TEXT,
ADD COLUMN     "suspendedBy" TEXT,
ADD COLUMN     "suspensionReason" TEXT;

-- DropTable
DROP TABLE "flags";

-- CreateTable
CREATE TABLE "PostCategory" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostFlag" (
    "id" TEXT NOT NULL,
    "reason" "FlagReason" NOT NULL,
    "customReason" TEXT,
    "description" TEXT,
    "status" "FlagStatus" NOT NULL DEFAULT 'PENDING',
    "severity" "FlagSeverity" NOT NULL DEFAULT 'MEDIUM',
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "commentId" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PostFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "action" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "postId" TEXT,
    "commentId" TEXT,
    "userId" TEXT,
    "moderatorId" TEXT NOT NULL,
    "moderatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "previousState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostCategory_postId_idx" ON "PostCategory"("postId");

-- CreateIndex
CREATE INDEX "PostCategory_categoryId_idx" ON "PostCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_postId_categoryId_key" ON "PostCategory"("postId", "categoryId");

-- CreateIndex
CREATE INDEX "PostFlag_postId_idx" ON "PostFlag"("postId");

-- CreateIndex
CREATE INDEX "PostFlag_userId_idx" ON "PostFlag"("userId");

-- CreateIndex
CREATE INDEX "PostFlag_status_idx" ON "PostFlag"("status");

-- CreateIndex
CREATE INDEX "PostFlag_reviewedBy_idx" ON "PostFlag"("reviewedBy");

-- CreateIndex
CREATE INDEX "PostFlag_createdAt_idx" ON "PostFlag"("createdAt");

-- CreateIndex
CREATE INDEX "PostFlag_postId_status_idx" ON "PostFlag"("postId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PostFlag_userId_postId_reason_key" ON "PostFlag"("userId", "postId", "reason");

-- CreateIndex
CREATE INDEX "ModerationAction_postId_idx" ON "ModerationAction"("postId");

-- CreateIndex
CREATE INDEX "ModerationAction_moderatorId_idx" ON "ModerationAction"("moderatorId");

-- CreateIndex
CREATE INDEX "ModerationAction_userId_idx" ON "ModerationAction"("userId");

-- CreateIndex
CREATE INDEX "ModerationAction_action_idx" ON "ModerationAction"("action");

-- CreateIndex
CREATE INDEX "ModerationAction_moderatedAt_idx" ON "ModerationAction"("moderatedAt");

-- CreateIndex
CREATE INDEX "ModerationAction_isActive_idx" ON "ModerationAction"("isActive");

-- CreateIndex
CREATE INDEX "ModerationAction_postId_action_idx" ON "ModerationAction"("postId", "action");

-- CreateIndex
CREATE INDEX "Post_categoryIds_idx" ON "Post"("categoryIds");

-- CreateIndex
CREATE INDEX "Post_primaryCategoryId_idx" ON "Post"("primaryCategoryId");

-- CreateIndex
CREATE INDEX "Post_moderationStatus_idx" ON "Post"("moderationStatus");

-- CreateIndex
CREATE INDEX "Post_isFlagged_idx" ON "Post"("isFlagged");

-- CreateIndex
CREATE INDEX "Post_moderatedBy_idx" ON "Post"("moderatedBy");

-- CreateIndex
CREATE INDEX "Post_lastModeratedAt_idx" ON "Post"("lastModeratedAt");

-- CreateIndex
CREATE INDEX "Post_createdAt_moderationStatus_idx" ON "Post"("createdAt", "moderationStatus");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isVerified_idx" ON "users"("isVerified");

-- CreateIndex
CREATE INDEX "users_isSuspended_idx" ON "users"("isSuspended");

-- CreateIndex
CREATE INDEX "users_isBanned_idx" ON "users"("isBanned");

-- CreateIndex
CREATE INDEX "users_lastActiveAt_idx" ON "users"("lastActiveAt");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_role_isVerified_idx" ON "users"("role", "isVerified");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostFlag" ADD CONSTRAINT "PostFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostFlag" ADD CONSTRAINT "PostFlag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostFlag" ADD CONSTRAINT "PostFlag_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_suspendedBy_fkey" FOREIGN KEY ("suspendedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_bannedBy_fkey" FOREIGN KEY ("bannedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
