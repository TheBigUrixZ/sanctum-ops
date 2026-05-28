import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const confirmation = String(body.confirmation || "");

  if (confirmation !== "RESET") {
    return NextResponse.json({ error: "Type RESET to confirm." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.deleteMany();
    await tx.expense.deleteMany();
    await tx.inventoryMovement.deleteMany();
    await tx.inventoryItem.deleteMany();
    await tx.productVariant.deleteMany();
    await tx.product.deleteMany();
    await tx.drop.deleteMany();
    await tx.activityLog.deleteMany();
    await tx.activityLog.create({
      data: {
        type: "RESET_DATA",
        itemName: "Test data",
        note: "Cleared local inventory, sales, expenses, drops, and movements",
      },
    });
  });

  return NextResponse.json({ ok: true });
}
