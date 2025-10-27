-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'JUDGING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('INDIVIDUAL', 'TEAM', 'COMPANY', 'STUDENT', 'KIDS');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_SUBMITTED', 'DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'RESUBMITTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'UPCOMING',
    "registrationFee" DOUBLE PRECISION NOT NULL,
    "earlyBirdDiscount" DOUBLE PRECISION,
    "earlyBirdDeadline" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "maxTeamSize" INTEGER NOT NULL DEFAULT 1,
    "totalPrizeFund" DOUBLE PRECISION NOT NULL,
    "prizes" JSONB NOT NULL,
    "thumbnail" TEXT,
    "heroImage" TEXT,
    "requirements" JSONB,
    "judgePanel" JSONB,
    "timeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionRegistrationType" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "type" "RegistrationType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fee" DOUBLE PRECISION NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 1,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionRegistrationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationCart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "registrationTypeId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "participantType" "RegistrationType" NOT NULL,
    "referralSource" TEXT,
    "members" JSONB NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToWebsiteTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToPrivacyPolicy" BOOLEAN NOT NULL DEFAULT false,
    "agreedToRefundPolicy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionRegistration" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "registrationTypeId" TEXT NOT NULL,
    "paymentId" TEXT,
    "country" TEXT NOT NULL,
    "participantType" "RegistrationType" NOT NULL,
    "referralSource" TEXT,
    "members" JSONB NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "submissionStatus" "SubmissionStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submissionFiles" JSONB,
    "submissionNotes" TEXT,
    "submissionUrl" TEXT,
    "score" DOUBLE PRECISION,
    "judgeComments" JSONB,
    "rank" INTEGER,
    "award" TEXT,
    "certificateUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "merchantId" TEXT NOT NULL,
    "merchantSecret" TEXT,
    "paymentId" TEXT,
    "statusCode" TEXT,
    "md5sig" TEXT,
    "paymentMethod" TEXT,
    "cardHolderName" TEXT,
    "cardNo" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB NOT NULL,
    "customerDetails" JSONB,
    "metadata" JSONB,
    "responseData" JSONB,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE INDEX "Competition_slug_idx" ON "Competition"("slug");

-- CreateIndex
CREATE INDEX "Competition_status_idx" ON "Competition"("status");

-- CreateIndex
CREATE INDEX "Competition_year_idx" ON "Competition"("year");

-- CreateIndex
CREATE INDEX "Competition_registrationDeadline_idx" ON "Competition"("registrationDeadline");

-- CreateIndex
CREATE INDEX "CompetitionRegistrationType_competitionId_idx" ON "CompetitionRegistrationType"("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionRegistrationType_isActive_idx" ON "CompetitionRegistrationType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistrationType_competitionId_type_key" ON "CompetitionRegistrationType"("competitionId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationCart_sessionId_key" ON "RegistrationCart"("sessionId");

-- CreateIndex
CREATE INDEX "RegistrationCart_userId_idx" ON "RegistrationCart"("userId");

-- CreateIndex
CREATE INDEX "RegistrationCart_status_idx" ON "RegistrationCart"("status");

-- CreateIndex
CREATE INDEX "RegistrationCart_sessionId_idx" ON "RegistrationCart"("sessionId");

-- CreateIndex
CREATE INDEX "RegistrationCart_expiresAt_idx" ON "RegistrationCart"("expiresAt");

-- CreateIndex
CREATE INDEX "RegistrationCart_userId_status_idx" ON "RegistrationCart"("userId", "status");

-- CreateIndex
CREATE INDEX "RegistrationCartItem_cartId_idx" ON "RegistrationCartItem"("cartId");

-- CreateIndex
CREATE INDEX "RegistrationCartItem_competitionId_idx" ON "RegistrationCartItem"("competitionId");

-- CreateIndex
CREATE INDEX "RegistrationCartItem_registrationTypeId_idx" ON "RegistrationCartItem"("registrationTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_registrationNumber_key" ON "CompetitionRegistration"("registrationNumber");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_userId_idx" ON "CompetitionRegistration"("userId");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_competitionId_idx" ON "CompetitionRegistration"("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_registrationNumber_idx" ON "CompetitionRegistration"("registrationNumber");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_status_idx" ON "CompetitionRegistration"("status");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_registrationTypeId_idx" ON "CompetitionRegistration"("registrationTypeId");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_paymentId_idx" ON "CompetitionRegistration"("paymentId");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_userId_competitionId_idx" ON "CompetitionRegistration"("userId", "competitionId");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_status_competitionId_idx" ON "CompetitionRegistration"("status", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionPayment_orderId_key" ON "CompetitionPayment"("orderId");

-- CreateIndex
CREATE INDEX "CompetitionPayment_userId_idx" ON "CompetitionPayment"("userId");

-- CreateIndex
CREATE INDEX "CompetitionPayment_competitionId_idx" ON "CompetitionPayment"("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionPayment_orderId_idx" ON "CompetitionPayment"("orderId");

-- CreateIndex
CREATE INDEX "CompetitionPayment_status_idx" ON "CompetitionPayment"("status");

-- CreateIndex
CREATE INDEX "CompetitionPayment_paymentId_idx" ON "CompetitionPayment"("paymentId");

-- CreateIndex
CREATE INDEX "CompetitionPayment_userId_competitionId_idx" ON "CompetitionPayment"("userId", "competitionId");

-- AddForeignKey
ALTER TABLE "CompetitionRegistrationType" ADD CONSTRAINT "CompetitionRegistrationType_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationCart" ADD CONSTRAINT "RegistrationCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationCartItem" ADD CONSTRAINT "RegistrationCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "RegistrationCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationCartItem" ADD CONSTRAINT "RegistrationCartItem_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationCartItem" ADD CONSTRAINT "RegistrationCartItem_registrationTypeId_fkey" FOREIGN KEY ("registrationTypeId") REFERENCES "CompetitionRegistrationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_registrationTypeId_fkey" FOREIGN KEY ("registrationTypeId") REFERENCES "CompetitionRegistrationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CompetitionPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionPayment" ADD CONSTRAINT "CompetitionPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionPayment" ADD CONSTRAINT "CompetitionPayment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
