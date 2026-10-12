-- CreateTable
CREATE TABLE "wine_list" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'WISHLIST',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wine_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wine_list_item" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "wineId" TEXT,
    "name" TEXT NOT NULL,
    "producer" TEXT,
    "vintage" INTEGER,
    "note" TEXT,
    "url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "reservedBy" TEXT,
    "reservedAt" TIMESTAMP(3),
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wine_list_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wine_list_shareId_key" ON "wine_list"("shareId");

-- CreateIndex
CREATE INDEX "wine_list_userId_idx" ON "wine_list"("userId");

-- CreateIndex
CREATE INDEX "wine_list_item_listId_position_idx" ON "wine_list_item"("listId", "position");

-- AddForeignKey
ALTER TABLE "wine_list" ADD CONSTRAINT "wine_list_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wine_list_item" ADD CONSTRAINT "wine_list_item_listId_fkey" FOREIGN KEY ("listId") REFERENCES "wine_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wine_list_item" ADD CONSTRAINT "wine_list_item_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
