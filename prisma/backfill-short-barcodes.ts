import { PrismaClient } from "@prisma/client";
import { formatShortBarcodeId, shortBarcodeNumber } from "../lib/inventory-items";

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }],
    select: {
      id: true,
      itemCode: true,
      shortBarcodeId: true,
    },
  });

  let nextNumber =
    items.reduce(
      (max, item) => Math.max(max, shortBarcodeNumber(item.shortBarcodeId)),
      0,
    ) + 1;

  for (const item of items) {
    if (item.shortBarcodeId) continue;

    const shortBarcodeId = formatShortBarcodeId(nextNumber);
    nextNumber += 1;

    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { shortBarcodeId },
    });

    console.log(`${item.itemCode} -> ${shortBarcodeId}`);
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
