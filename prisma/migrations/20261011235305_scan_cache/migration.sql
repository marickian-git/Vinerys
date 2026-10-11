-- CreateTable
CREATE TABLE "scan_cache" (
    "id" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "providers" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHitAt" TIMESTAMP(3),

    CONSTRAINT "scan_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scan_cache_imageHash_key" ON "scan_cache"("imageHash");

-- CreateIndex
CREATE INDEX "scan_cache_createdAt_idx" ON "scan_cache"("createdAt");
