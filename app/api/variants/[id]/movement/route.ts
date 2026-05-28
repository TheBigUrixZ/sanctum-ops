import { NextResponse } from "next/server";
import { generateInventoryItems } from "@/lib/inventory-items";
import { prisma } from "@/lib/prisma";

const movementConfig = {
  ADD: { delta: 0, note: "Bulk inventory ordered", storedType: "ORDERED" },
  REMOVE: { delta: -1, note: "Removed stock", storedType: "REMOVE" },
  ADD_STOCK: { delta: 0, note: "Bulk inventory ordered", storedType: "ORDERED" },
  REMOVE_STOCK: { delta: -1, note: "Removed stock", storedType: "REMOVE" },
  SOLD: { delta: -1, note: "Marked sold" },
  RETURN: { delta: 0, note: "Returned item" },
} as const;

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const type = String(body.type || "") as keyof typeof movementConfig;
  const amount = Number(body.quantity || 1);
  const note = String(body.note || "").trim();
  const config = movementConfig[type];

  if (!config) {
    return NextResponse.json({ error: "Invalid movement type." }, { status: 400 });
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "Quantity must be at least 1." }, { status: 400 });
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id },
  });

  if (!variant) {
    return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  const delta = config.delta * amount;
  if (variant.quantity + delta < 0) {
    return NextResponse.json({ error: "Not enough stock for that action." }, { status: 400 });
  }

  const requestedType = "storedType" in config ? config.storedType : type;
  if (requestedType === "REMOVE" || requestedType === "SOLD") {
    const physicalInStock = await prisma.inventoryItem.count({
      where: { variantId: id, status: "IN_STOCK" },
    });
    if (physicalInStock < amount) {
      return NextResponse.json({ error: "Not enough physical items in stock for that action." }, { status: 400 });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const storedType = requestedType;

    if (storedType === "ORDERED") {
      await generateInventoryItems({
        tx,
        variantId: id,
        sku: variant.sku,
        quantity: amount,
        status: "ORDERED",
        notes: note || config.note,
      });
    }

    if (storedType === "REMOVE" || storedType === "SOLD") {
      const stockItems = await tx.inventoryItem.findMany({
        where: { variantId: id, status: "IN_STOCK" },
        orderBy: { receivedAt: "asc" },
        take: amount,
      });

      await tx.inventoryItem.updateMany({
        where: { id: { in: stockItems.map((item) => item.id) } },
        data: {
          status: storedType === "SOLD" ? "SOLD" : "LOST",
          soldAt: storedType === "SOLD" ? new Date() : undefined,
          notes: note || config.note,
        },
      });
    }

    await tx.inventoryMovement.create({
      data: {
        variantId: id,
        type: storedType,
        quantity: amount,
        note: note || config.note,
      },
    });

    await tx.activityLog.create({
      data: {
        type: storedType,
        sku: variant.sku,
        itemName: variant.sku,
        quantity: amount,
        note: note || config.note,
      },
    });

    const inStockCount = await tx.inventoryItem.count({
      where: { variantId: id, status: "IN_STOCK" },
    });

    return tx.productVariant.update({
      where: { id },
      data: { quantity: inStockCount },
      include: {
        product: true,
        movements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  });

  return NextResponse.json(updated);
}
