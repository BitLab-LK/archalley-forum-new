-- CreateEnum
CREATE TYPE "AdPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roleChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "redirectUrl" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "priority" "AdPriority" NOT NULL DEFAULT 'LOW',
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "lastEditedBy" TEXT,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Advertisement_active_idx" ON "Advertisement"("active");

-- CreateIndex
CREATE INDEX "Advertisement_size_active_idx" ON "Advertisement"("size", "active");

-- CreateIndex
CREATE INDEX "Advertisement_priority_weight_idx" ON "Advertisement"("priority", "weight");

-- CreateIndex
CREATE INDEX "Advertisement_createdAt_idx" ON "Advertisement"("createdAt");

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_lastEditedBy_fkey" FOREIGN KEY ("lastEditedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
