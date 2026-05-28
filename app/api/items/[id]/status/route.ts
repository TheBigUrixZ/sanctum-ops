import { NextResponse } from "next/server";
import { dollarsToCents } from "@/lib/codes";
import { isItemStatus } from "@/lib/inventory-items";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const movementTypeByStatus = {
  IN_STOCK: "RECEIVED",
  RETURNED: "RETURNED",
  SOLD: "SOLD",
  DAMAGED: "DAMAGED",
  LOST: "LOST",
} as const;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || "").toUpperCase();
  const note = String(body.note || "").trim();
  const force = Boolean(body.force);
  const platform = String(body.platform || "").trim();
  const fees = dollarsToCents(body.fees || 0);
  const shippingCost = dollarsToCents(body.shippingCost || 0);

  if (!isItemStatus(status)) {
    return NextResponse.json({ error: "Invalid item status." }, { status: 400 });
  }

  if (status === "ORDERED") {
    return NextResponse.json({ error: "Scans cannot move an item back to ORDERED." }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { variant: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (status === item.status && !force) {
    return NextResponse.json(
      { error: `Item is already ${item.status}. No duplicate movement was created.` },
      { status: 409 },
    );
  }

  if (status === "IN_STOCK" && item.status !== "ORDERED" && item.status !== "RETURNED" && !force) {
    return NextResponse.json(
      { error: `Only ORDERED or RETURNED items can be received. ${item.itemCode} is ${item.status}.` },
      { status: 409 },
    );
  }

  if (status === "SOLD") {
    if (item.status === "ORDERED") {
      return NextResponse.json(
        { error: `${item.itemCode} is ORDERED and has not been received yet. Sale blocked.` },
        { status: 409 },
      );
    }
    if (item.status !== "IN_STOCK" && !force) {
      return NextResponse.json(
        { error: `${item.itemCode} is ${item.status}. Only IN_STOCK items can be sold.` },
        { status: 409 },
      );
    }
    const existingSale = await prisma.sale.findUnique({ where: { itemCode: item.itemCode } });
    if (existingSale) {
      return NextResponse.json(
        { error: `Sale already exists for ${item.itemCode}. Duplicate sale blocked.` },
        { status: 409 },
      );
    }
  }

  const now = new Date();
  const previousStatus = item.status;
  const updated = await prisma.$transaction(async (tx) => {
    const salePrice = body.salePrice ? dollarsToCents(body.salePrice) : item.variant.sellPrice;
    const productCost = item.variant.cost;
    const netProfit = salePrice - productCost - fees - shippingCost;

    const updatedItem = await tx.inventoryItem.update({
      where: { id },
      data: {
        status,
        soldAt: status === "SOLD" ? now : item.soldAt,
        receivedAt: status === "IN_STOCK" ? now : item.receivedAt,
        notes: note || item.notes,
      },
      include: {
        variant: {
          include: {
            product: true,
            items: true,
            movements: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        type: movementTypeByStatus[status],
        quantity: 1,
        note: note || `Item ${item.itemCode} changed from ${previousStatus} to ${status}`,
      },
    });

    await tx.activityLog.create({
      data: {
        type: movementTypeByStatus[status],
        sku: item.variant.sku,
        itemName: item.itemCode,
        quantity: 1,
        note: note || `Item changed from ${previousStatus} to ${status}`,
      },
    });

    if (status === "SOLD") {
      await tx.sale.create({
        data: {
          variantId: item.variantId,
          sku: item.variant.sku,
          itemCode: item.itemCode,
          quantity: 1,
          salePrice,
          grossRevenue: salePrice,
          productCost,
          fees,
          shippingCost,
          netProfit,
          platform: platform || null,
          note: note || null,
          soldAt: now,
        },
      });
    }

    const inStockCount = await tx.inventoryItem.count({
      where: { variantId: item.variantId, status: "IN_STOCK" },
    });

    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { quantity: inStockCount },
    });

    return updatedItem;
  });

  return NextResponse.json({ ...updated, previousStatus });
}
