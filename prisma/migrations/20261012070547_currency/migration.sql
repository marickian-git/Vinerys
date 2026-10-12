-- AlterTable
ALTER TABLE "Wine" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR';
