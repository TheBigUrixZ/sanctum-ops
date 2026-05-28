import { PrismaClient } from "@prisma/client";
import { generateInventoryItems } from "../lib/inventory-items";

const prisma = new PrismaClient();

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: {
      items: true,
    },
  });

  for (const variant of variants) {
    if (variant.items.length > 0 || variant.quantity <= 0) continue;

    await prisma.$transaction(async (tx) => {
      await generateInventoryItems({
        tx,
        variantId: variant.id,
        sku: variant.sku,
        quantity: variant.quantity,
        status: "IN_STOCK",
        notes: "Backfilled from existing variant quantity",
      });

      await tx.activityLog.create({
        data: {
          type: "BACKFILLED_ITEMS",
          sku: variant.sku,
          itemName: variant.sku,
          quantity: variant.quantity,
          note: "Created physical inventory items from existing quantity",
        },
      });
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
