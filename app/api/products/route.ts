import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  cleanCode,
  colorCodes,
  dollarsToCents,
  generateSku,
  productCodes,
  type ColorName,
  type ProductName,
} from "@/lib/codes";
import { generateInventoryItems } from "@/lib/inventory-items";
import { getSettings } from "@/lib/settings";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const productName = String(body.productName || "") as ProductName;
  const color = String(body.color || "") as ColorName;
  const size = cleanCode(String(body.size || ""));
  const dropCode = cleanCode(String(body.dropCode || ""));
  const quantity = Number(body.quantity || 0);

  if (!productCodes[productName]) {
    return NextResponse.json({ error: "Choose a valid product type." }, { status: 400 });
  }

  if (!colorCodes[color]) {
    return NextResponse.json({ error: "Choose a valid color." }, { status: 400 });
  }

  if (!size || !dropCode) {
    return NextResponse.json({ error: "Size and drop code are required." }, { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json({ error: "Quantity ordered must be zero or higher." }, { status: 400 });
  }

  const productCode = productCodes[productName];
  const colorCode = colorCodes[color];
  const settings = await getSettings();
  const sku = generateSku({ brandCode: settings.brandCode, productCode, colorCode, size, dropCode });

  const existing = await prisma.productVariant.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json({ error: `SKU already exists: ${sku}` }, { status: 409 });
  }

  const product = await prisma.product.upsert({
    where: { id: productCode },
    update: {},
    create: {
      id: productCode,
      name: productName,
      code: productCode,
      description: body.description ? String(body.description) : null,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
    },
  });

  const variant = await prisma.$transaction(async (tx) => {
    const created = await tx.productVariant.create({
      data: {
        productId: product.id,
        size,
        color,
        colorCode,
        quantity: 0,
        cost: dollarsToCents(body.cost || 0),
        sellPrice: dollarsToCents(body.sellPrice || 0),
        lowStockThreshold: Number(body.lowStockThreshold ?? settings.defaultLowStockThreshold),
        dropCode,
        sku,
        barcode: sku,
        imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
      },
      include: { product: true },
    });

    if (quantity > 0) {
      await generateInventoryItems({
        tx,
        variantId: created.id,
        sku,
          quantity,
          status: "ORDERED",
          notes: "Bulk order entered before receiving",
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: created.id,
            type: "ORDERED",
            quantity,
            note: "Bulk order entered before receiving",
          },
        });
    }

    await tx.activityLog.create({
      data: {
        type: "ADDED_VARIANT",
        sku,
        itemName: productName,
        quantity,
        note: "Added product variant",
      },
    });

    return created;
  });

  return NextResponse.json(variant, { status: 201 });
}
