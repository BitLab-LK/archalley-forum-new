-- CreateTable
CREATE TABLE "JuryMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "competitionId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JuryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuryScore" (
    "id" TEXT NOT NULL,
    "juryMemberId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "conceptScore" DOUBLE PRECISION NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "compositionScore" DOUBLE PRECISION NOT NULL,
    "balanceScore" DOUBLE PRECISION NOT NULL,
    "colourScore" DOUBLE PRECISION NOT NULL,
    "designRelativityScore" DOUBLE PRECISION NOT NULL,
    "aestheticAppealScore" DOUBLE PRECISION NOT NULL,
    "unconventionalMaterialsScore" DOUBLE PRECISION NOT NULL,
    "overallMaterialScore" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JuryScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuryScoringProgress" (
    "id" TEXT NOT NULL,
    "juryMemberId" TEXT NOT NULL,
    "totalAssignedEntries" INTEGER NOT NULL DEFAULT 0,
    "submittedScores" INTEGER NOT NULL DEFAULT 0,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageScoreGiven" DOUBLE PRECISION,
    "lastScoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JuryScoringProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JuryMember_userId_key" ON "JuryMember"("userId");

-- CreateIndex
CREATE INDEX "JuryMember_userId_idx" ON "JuryMember"("userId");

-- CreateIndex
CREATE INDEX "JuryMember_isActive_idx" ON "JuryMember"("isActive");

-- CreateIndex
CREATE INDEX "JuryMember_competitionId_idx" ON "JuryMember"("competitionId");

-- CreateIndex
CREATE INDEX "JuryMember_userId_isActive_idx" ON "JuryMember"("userId", "isActive");

-- CreateIndex
CREATE INDEX "JuryScore_juryMemberId_idx" ON "JuryScore"("juryMemberId");

-- CreateIndex
CREATE INDEX "JuryScore_registrationNumber_idx" ON "JuryScore"("registrationNumber");

-- CreateIndex
CREATE INDEX "JuryScore_submittedAt_idx" ON "JuryScore"("submittedAt");

-- CreateIndex
CREATE INDEX "JuryScore_juryMemberId_submittedAt_idx" ON "JuryScore"("juryMemberId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JuryScore_juryMemberId_registrationNumber_key" ON "JuryScore"("juryMemberId", "registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JuryScoringProgress_juryMemberId_key" ON "JuryScoringProgress"("juryMemberId");

-- CreateIndex
CREATE INDEX "JuryScoringProgress_completionPercentage_idx" ON "JuryScoringProgress"("completionPercentage");

-- CreateIndex
CREATE INDEX "JuryScoringProgress_lastScoredAt_idx" ON "JuryScoringProgress"("lastScoredAt");

-- AddForeignKey
ALTER TABLE "JuryMember" ADD CONSTRAINT "JuryMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuryScore" ADD CONSTRAINT "JuryScore_juryMemberId_fkey" FOREIGN KEY ("juryMemberId") REFERENCES "JuryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuryScore" ADD CONSTRAINT "JuryScore_registrationNumber_fkey" FOREIGN KEY ("registrationNumber") REFERENCES "CompetitionSubmission"("registrationNumber") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuryScoringProgress" ADD CONSTRAINT "JuryScoringProgress_juryMemberId_fkey" FOREIGN KEY ("juryMemberId") REFERENCES "JuryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
