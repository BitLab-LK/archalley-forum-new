-- CreateTable
CREATE TABLE "BriefDownloadRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "firstRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefDownloadRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BriefDownloadRequest_token_key" ON "BriefDownloadRequest"("token");

-- CreateIndex
CREATE INDEX "BriefDownloadRequest_email_idx" ON "BriefDownloadRequest"("email");

-- CreateIndex
CREATE INDEX "BriefDownloadRequest_token_idx" ON "BriefDownloadRequest"("token");

-- CreateIndex
CREATE INDEX "BriefDownloadRequest_userId_idx" ON "BriefDownloadRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BriefDownloadRequest_email_key" ON "BriefDownloadRequest"("email");

-- AddForeignKey
ALTER TABLE "BriefDownloadRequest" ADD CONSTRAINT "BriefDownloadRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
