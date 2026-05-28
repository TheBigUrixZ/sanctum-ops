import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    return NextResponse.json({ error: "Sale not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.delete({ where: { id } });
    await tx.activityLog.create({
      data: {
        type: "DELETED_SALE",
        sku: sale.sku,
        itemName: sale.itemCode || sale.sku,
        quantity: sale.quantity,
        note: "Deleted sale record",
      },
    });
  });

  return NextResponse.json({ ok: true });
}
