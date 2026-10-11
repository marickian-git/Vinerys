-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "operation" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_userId_createdAt_idx" ON "ai_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_agentId_idx" ON "ai_usage"("agentId");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
