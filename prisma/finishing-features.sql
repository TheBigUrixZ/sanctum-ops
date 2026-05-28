ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN "imageUrl" TEXT;

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
