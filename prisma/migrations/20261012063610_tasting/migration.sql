-- AlterEnum
ALTER TYPE "LogAction" ADD VALUE 'TASTED';

-- CreateTable
CREATE TABLE "tasting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wineId" TEXT,
    "wineName" TEXT NOT NULL,
    "tastedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER,
    "occasion" TEXT,
    "people" TEXT[],
    "food" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "photoUrls" TEXT[],
    "aromas" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasting_userId_tastedAt_idx" ON "tasting"("userId", "tastedAt");

-- CreateIndex
CREATE INDEX "tasting_wineId_idx" ON "tasting"("wineId");

-- AddForeignKey
ALTER TABLE "tasting" ADD CONSTRAINT "tasting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasting" ADD CONSTRAINT "tasting_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
