-- AlterTable
ALTER TABLE "RegistrationCartItem" ADD COLUMN     "businessRegistrationNo" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "teamMembers" JSONB,
ADD COLUMN     "teamName" TEXT;
