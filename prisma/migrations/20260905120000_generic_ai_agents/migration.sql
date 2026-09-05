ALTER TABLE "ai_agent" ADD COLUMN "providerType" TEXT NOT NULL DEFAULT 'preset';
ALTER TABLE "ai_agent" ADD COLUMN "baseUrl" TEXT;
ALTER TABLE "ai_agent" ADD COLUMN "billingType" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "ai_agent" ADD COLUMN "capabilities" JSONB;
ALTER TABLE "ai_agent" ADD COLUMN "metadata" JSONB;
ALTER TABLE "ai_agent" ADD COLUMN "suggestedModel" TEXT;