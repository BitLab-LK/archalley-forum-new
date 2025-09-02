/*
  Warnings:

  - You are about to drop the `UserBadge` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('EVERYONE', 'MEMBERS_ONLY', 'ONLY_ME');

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "behanceUrl" TEXT,
ADD COLUMN     "dribbbleUrl" TEXT,
ADD COLUMN     "emailPrivacy" "PrivacyLevel" NOT NULL DEFAULT 'MEMBERS_ONLY',
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "otherSocialUrl" TEXT,
ADD COLUMN     "phonePrivacy" "PrivacyLevel" NOT NULL DEFAULT 'ONLY_ME',
ADD COLUMN     "profilePhotoPrivacy" "PrivacyLevel" NOT NULL DEFAULT 'EVERYONE',
ADD COLUMN     "tiktokUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- DropTable
DROP TABLE "UserBadge";

-- CreateTable
CREATE TABLE "userBadges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedBy" TEXT,

    CONSTRAINT "userBadges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "userBadges_userId_idx" ON "userBadges"("userId");

-- CreateIndex
CREATE INDEX "userBadges_badgeId_idx" ON "userBadges"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "userBadges_userId_badgeId_key" ON "userBadges"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "userBadges" ADD CONSTRAINT "userBadges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userBadges" ADD CONSTRAINT "userBadges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
