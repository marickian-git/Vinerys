-- AlterTable
ALTER TABLE "user" ADD COLUMN     "aiApiKey" TEXT,
ADD COLUMN     "aiProvider" TEXT DEFAULT 'gemini';
