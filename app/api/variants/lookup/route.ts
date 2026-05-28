import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get("sku")?.trim().toUpperCase();

  if (!sku) {
    return NextResponse.json({ error: "SKU is required." }, { status: 400 });
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      OR: [{ sku }, { barcode: sku }],
    },
    include: {
      product: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!variant) {
    return NextResponse.json({ error: "No matching variant found." }, { status: 404 });
  }

  return NextResponse.json(variant);
}
