-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "originalLanguage" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN     "translatedContent" TEXT;
