CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "sellPrice" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "imageUrl" TEXT,
    "dropCode" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InventoryMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_barcode_key" ON "ProductVariant"("barcode");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_shortBarcodeId_key" ON "InventoryItem"("shortBarcodeId");

CREATE TABLE IF NOT EXISTS "Drop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "releaseDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "itemCode" TEXT,
    "quantity" INTEGER NOT NULL,
    "salePrice" INTEGER NOT NULL,
    "grossRevenue" INTEGER NOT NULL,
    "productCost" INTEGER NOT NULL,
    "fees" INTEGER NOT NULL DEFAULT 0,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "netProfit" INTEGER NOT NULL,
    "platform" TEXT,
    "note" TEXT,
    "soldAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_itemCode_key" ON "Sale"("itemCode");

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "spentAt" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Drop_code_key" ON "Drop"("code");

CREATE TABLE IF NOT EXISTS "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "brandCode" TEXT NOT NULL DEFAULT 'CAE',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "defaultLowStockThreshold" INTEGER NOT NULL DEFAULT 2,
    "labelWidth" TEXT NOT NULL DEFAULT '2in',
    "labelHeight" TEXT NOT NULL DEFAULT '1in',
    "defaultDropCode" TEXT NOT NULL DEFAULT 'D001',
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "sku" TEXT,
    "itemName" TEXT,
    "quantity" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO "AppSettings" ("id", "brandCode", "currency", "defaultLowStockThreshold", "labelWidth", "labelHeight", "defaultDropCode", "updatedAt")
VALUES ('default', 'CAE', 'USD', 2, '2in', '1in', 'D001', CURRENT_TIMESTAMP);
