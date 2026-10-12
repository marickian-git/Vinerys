-- CreateTable
CREATE TABLE "wine_valuation" (
    "id" TEXT NOT NULL,
    "wineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wine_valuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wine_valuation_wineId_recordedAt_idx" ON "wine_valuation"("wineId", "recordedAt");

-- CreateIndex
CREATE INDEX "wine_valuation_userId_idx" ON "wine_valuation"("userId");

-- AddForeignKey
ALTER TABLE "wine_valuation" ADD CONSTRAINT "wine_valuation_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: valoarea curentă a vinurilor existente devine primul punct din istoric (data adăugării vinului)
INSERT INTO "wine_valuation" ("id", "wineId", "userId", "value", "currency", "source", "recordedAt")
SELECT 'val_' || md5(random()::text || "id"), "id", "userId", "estimatedValue", "currency", 'initial', "createdAt"
FROM "Wine" WHERE "estimatedValue" IS NOT NULL;
