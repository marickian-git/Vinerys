-- Tabela wine_log exista în producție (creată cu `db push`), dar lipsea din istoricul de migrații.
-- Migrație idempotentă: o creează pe bazele noi (dev, CI), nu face nimic unde există deja.

DO $$ BEGIN
  CREATE TYPE "LogAction" AS ENUM ('ADDED', 'UPDATED', 'CONSUMED', 'SOLD', 'GIFTED', 'SCAN_AI', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "wine_log" (
    "id" TEXT NOT NULL,
    "wineId" TEXT,
    "userId" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wine_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wine_log_wineId_idx" ON "wine_log"("wineId");
CREATE INDEX IF NOT EXISTS "wine_log_userId_idx" ON "wine_log"("userId");
CREATE INDEX IF NOT EXISTS "wine_log_action_idx" ON "wine_log"("action");

DO $$ BEGIN
  ALTER TABLE "wine_log" ADD CONSTRAINT "wine_log_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "wine_log" ADD CONSTRAINT "wine_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
