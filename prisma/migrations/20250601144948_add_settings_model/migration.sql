/*
  Warnings:

  - You are about to drop the column `createdAt` on the `settings` table. All the data in the column will be lost.
  - Added the required column `updatedById` to the `settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "settings" DROP COLUMN "createdAt",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "updatedById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
