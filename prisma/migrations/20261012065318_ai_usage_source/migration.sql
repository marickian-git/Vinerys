-- AlterTable
ALTER TABLE "ai_usage" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'byo';

-- CreateIndex
CREATE INDEX "ai_usage_userId_source_operation_createdAt_idx" ON "ai_usage"("userId", "source", "operation", "createdAt");
