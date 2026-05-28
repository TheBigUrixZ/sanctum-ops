ALTER TABLE "Sale" ADD COLUMN "itemCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_itemCode_key" ON "Sale"("itemCode");
