-- pg_trgm pentru căutarea fuzzy (CELLAR-009).
-- Tolerant: dacă userul DB-ului nu poate crea extensia, migrația trece (NOTICE), aplicația pornește,
-- iar căutarea folosește ILIKE (vezi fuzzyWineMatches). Se poate crea ulterior: CREATE EXTENSION pg_trgm;
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN insufficient_privilege OR feature_not_supported OR undefined_file THEN
  RAISE NOTICE 'pg_trgm indisponibil (%): căutarea fuzzy folosește ILIKE', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    -- CreateIndex
    CREATE INDEX IF NOT EXISTS "Wine_name_trgm_idx" ON "Wine" USING GIN ("name" gin_trgm_ops);
    -- CreateIndex
    CREATE INDEX IF NOT EXISTS "Wine_producer_trgm_idx" ON "Wine" USING GIN ("producer" gin_trgm_ops);
  END IF;
END $$;
