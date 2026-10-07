-- SEC-001: colecția publică devine opt-in.
ALTER TABLE "user" ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false;
-- Utilizatorii existenți devin privați. shareId se păstrează, deci la reactivare linkul vechi funcționează din nou.
