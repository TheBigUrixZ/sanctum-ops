import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          _count: {
            select: {
              movements: true,
              sales: true,
              items: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const deletedVariants = product.variants.length;
  const deletedMovements = product.variants.reduce(
    (sum, variant) => sum + variant._count.movements,
    0,
  );
  const deletedSales = product.variants.reduce((sum, variant) => sum + variant._count.sales, 0);
  const deletedItems = product.variants.reduce((sum, variant) => sum + variant._count.items, 0);

  await prisma.product.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      type: "DELETED_PRODUCT",
      itemName: product.name,
      quantity: deletedVariants,
      note: `Deleted product, ${deletedVariants} variants, and ${deletedItems} physical items`,
    },
  });

  return NextResponse.json({
    ok: true,
    deletedVariants,
    deletedItems,
    deletedMovements,
    deletedSales,
  });
}
