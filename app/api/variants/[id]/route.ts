import { NextResponse } from "next/server";
import { cleanCode, colorCodes, dollarsToCents, generateSku, productCodes } from "@/lib/codes";
import { generateInventoryItems, nextItemNumber } from "@/lib/inventory-items";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const productName = String(body.productName || "").trim();
  const productCode = productCodes[productName as keyof typeof productCodes];
  const color = String(body.color || "").trim();
  const colorCode = colorCodes[color as keyof typeof colorCodes];
  const size = cleanCode(String(body.size || ""));
  const dropCode = cleanCode(String(body.dropCode || ""));
  const requestedQuantity = body.quantity === undefined ? null : Number(body.quantity);
  const lowStockThreshold = Number(body.lowStockThreshold ?? 2);
  const notes = String(body.notes || "").trim();

  if (!productCode) {
    return NextResponse.json({ error: "Choose a valid product." }, { status: 400 });
  }

  if (!colorCode) {
    return NextResponse.json({ error: "Choose a valid color." }, { status: 400 });
  }

  if (!size || !dropCode) {
    return NextResponse.json({ error: "Size and drop code are required." }, { status: 400 });
  }

  if (requestedQuantity !== null && (!Number.isInteger(requestedQuantity) || requestedQuantity < 0)) {
    return NextResponse.json({ error: "Quantity must be zero or higher." }, { status: 400 });
  }

  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    return NextResponse.json({ error: "Low stock threshold must be zero or higher." }, { status: 400 });
  }

  const existing = await prisma.productVariant.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  const settings = await getSettings();
  const sku = generateSku({ brandCode: settings.brandCode, productCode, colorCode, size, dropCode });
  const duplicate = await prisma.productVariant.findUnique({ where: { sku } });

  if (duplicate && duplicate.id !== id) {
    return NextResponse.json({ error: `Another variant already uses SKU ${sku}.` }, { status: 409 });
  }

  const product = await prisma.product.upsert({
    where: { id: productCode },
    update: {},
    create: {
      id: productCode,
      name: productName,
      code: productCode,
    },
  });

  const updated = await prisma.$transaction(async (tx) => {
    const currentInStock = existing.items.filter((item) => item.status === "IN_STOCK");
    const quantityDelta = requestedQuantity === null ? 0 : requestedQuantity - currentInStock.length;

    const updatedVariant = await tx.productVariant.update({
      where: { id },
      data: {
        productId: product.id,
        color,
        colorCode,
        size,
        dropCode,
        quantity: currentInStock.length,
        cost: dollarsToCents(body.cost || 0),
        sellPrice: dollarsToCents(body.sellPrice || 0),
        lowStockThreshold,
        notes: notes || null,
        imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
        sku,
        barcode: sku,
      },
      include: {
        product: true,
        items: true,
        movements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (existing.sku !== sku) {
      for (const item of existing.items) {
        const number = nextItemNumber(item.itemCode, existing.sku);
        if (!number) continue;
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { itemCode: `${sku}-${String(number).padStart(4, "0")}` },
        });
      }
    }

    if (quantityDelta > 0) {
      await generateInventoryItems({
        tx,
        variantId: id,
        sku,
        quantity: quantityDelta,
        status: "ORDERED",
        notes: "Added by variant quantity edit",
      });
      await tx.inventoryMovement.create({
        data: { variantId: id, type: "ORDERED", quantity: quantityDelta, note: "Added by edit" },
      });
    }

    if (quantityDelta < 0) {
      const removeCount = Math.abs(quantityDelta);
      const toRemove = currentInStock.slice(0, removeCount);
      await tx.inventoryItem.updateMany({
        where: { id: { in: toRemove.map((item) => item.id) } },
        data: { status: "LOST", notes: "Removed by variant quantity edit" },
      });
      await tx.inventoryMovement.create({
        data: { variantId: id, type: "REMOVE", quantity: removeCount, note: "Removed by edit" },
      });
    }

    const inStockCount = await tx.inventoryItem.count({ where: { variantId: id, status: "IN_STOCK" } });
    await tx.productVariant.update({ where: { id }, data: { quantity: inStockCount } });

    await tx.activityLog.create({
      data: {
        type: "EDITED_VARIANT",
        sku,
        itemName: productName,
        quantity: requestedQuantity ?? currentInStock.length,
        note: "Variant edited",
      },
    });

    return updatedVariant;
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          movements: true,
          sales: true,
          items: true,
        },
      },
    },
  });

  if (!variant) {
    return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  await prisma.productVariant.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      type: "DELETED_VARIANT",
      sku: variant.sku,
      itemName: variant.sku,
      quantity: variant.quantity,
      note: "Deleted variant and related records",
    },
  });

  return NextResponse.json({
    ok: true,
    deletedMovements: variant._count.movements,
    deletedSales: variant._count.sales,
    deletedItems: variant._count.items,
  });
}
