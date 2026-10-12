-- pg_trgm pentru căutarea fuzzy (CELLAR-009)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Wine_name_trgm_idx" ON "Wine" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Wine_producer_trgm_idx" ON "Wine" USING GIN ("producer" gin_trgm_ops);
