import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.upsert({
    where: { id: "seed-hoodie" },
    update: {},
    create: {
      id: "seed-hoodie",
      name: "Hoodie",
      code: "HOOD",
      description: "Sample hoodie for local testing",
    },
  });

  const sku = "CAE-HOOD-BLK-L-D001";
  const existing = await prisma.productVariant.findUnique({ where: { sku } });

  if (!existing) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        size: "L",
        color: "Black",
        colorCode: "BLK",
        quantity: 12,
        cost: 2800,
        sellPrice: 6800,
        dropCode: "D001",
        sku,
        barcode: sku,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        variantId: variant.id,
        type: "INITIAL_STOCK",
        quantity: 12,
        note: "Seed stock",
      },
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
