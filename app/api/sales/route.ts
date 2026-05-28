import { NextResponse } from "next/server";
import { dollarsToCents } from "@/lib/codes";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const sku = String(body.sku || "").trim().toUpperCase();
  const quantity = Number(body.quantity || 0);
  const salePrice = dollarsToCents(body.salePrice || 0);
  const fees = dollarsToCents(body.fees || 0);
  const shippingCost = dollarsToCents(body.shippingCost || 0);
  const platform = String(body.platform || "").trim();
  const note = String(body.note || "").trim();
  const soldAt = body.date ? new Date(String(body.date)) : new Date();

  if (!sku) {
    return NextResponse.json({ error: "SKU or barcode is required." }, { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "Quantity must be at least 1." }, { status: 400 });
  }

  if (salePrice <= 0) {
    return NextResponse.json({ error: "Sale price must be greater than zero." }, { status: 400 });
  }

  if (Number.isNaN(soldAt.getTime())) {
    return NextResponse.json({ error: "Sale date is invalid." }, { status: 400 });
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      OR: [{ sku }, { barcode: sku }],
    },
    include: { items: true },
  });

  if (!variant) {
    return NextResponse.json({ error: "No matching variant found." }, { status: 404 });
  }

  const availableItems = variant.items.filter((item) => item.status === "IN_STOCK");
  if (availableItems.length < quantity) {
    return NextResponse.json({ error: "Not enough stock for this sale." }, { status: 400 });
  }

  const grossRevenue = salePrice * quantity;
  const productCost = variant.cost * quantity;
  const netProfit = grossRevenue - productCost - fees - shippingCost;

  const sale = await prisma.$transaction(async (tx) => {
    const soldItems = availableItems.slice(0, quantity);
    await tx.inventoryItem.updateMany({
      where: { id: { in: soldItems.map((item) => item.id) } },
      data: { status: "SOLD", soldAt: soldAt, notes: note || "Manual sale logged" },
    });

    await tx.inventoryMovement.create({
      data: {
        variantId: variant.id,
        type: "SOLD",
        quantity,
        note: "Manual sale logged",
      },
    });

    await tx.activityLog.create({
      data: {
        type: "ADDED_SALE",
        sku: variant.sku,
        itemName: variant.sku,
        quantity,
        note: note || "Manual sale logged",
      },
    });

    const inStockCount = await tx.inventoryItem.count({
      where: { variantId: variant.id, status: "IN_STOCK" },
    });

    await tx.productVariant.update({
      where: { id: variant.id },
      data: { quantity: inStockCount },
    });

    return tx.sale.create({
      data: {
        variantId: variant.id,
        sku: variant.sku,
        itemCode: soldItems[0]?.itemCode || null,
        quantity,
        salePrice,
        grossRevenue,
        productCost,
        fees,
        shippingCost,
        netProfit,
        platform: platform || null,
        note: note || null,
        soldAt,
      },
    });
  });

  return NextResponse.json(sale, { status: 201 });
}
