CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "shortBarcodeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" DATETIME,
    "packedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_shortBarcodeId_key" ON "InventoryItem"("shortBarcodeId");
