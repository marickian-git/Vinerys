/*
  Warnings:

  - A unique constraint covering the columns `[shareId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "shareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_shareId_key" ON "user"("shareId");
