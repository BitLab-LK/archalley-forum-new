/*
  Warnings:

  - You are about to drop the column `earlyBirdDiscount` on the `Competition` table. All the data in the column will be lost.
  - You are about to drop the column `maxTeamSize` on the `Competition` table. All the data in the column will be lost.
  - You are about to drop the column `merchantSecret` on the `CompetitionPayment` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `RegistrationCart` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `RegistrationCartItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "RegistrationCart_sessionId_idx";

-- DropIndex
DROP INDEX "RegistrationCart_sessionId_key";

-- AlterTable
ALTER TABLE "Competition" DROP COLUMN "earlyBirdDiscount",
DROP COLUMN "maxTeamSize";

-- AlterTable
ALTER TABLE "CompetitionPayment" DROP COLUMN "merchantSecret";

-- AlterTable
ALTER TABLE "CompetitionRegistration" ADD COLUMN     "businessRegistrationNo" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "teamMembers" JSONB,
ADD COLUMN     "teamName" TEXT;

-- AlterTable
ALTER TABLE "RegistrationCart" DROP COLUMN "sessionId";

-- AlterTable
ALTER TABLE "RegistrationCartItem" DROP COLUMN "quantity";
