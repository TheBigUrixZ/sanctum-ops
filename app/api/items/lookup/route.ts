import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Item code is required." }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findFirst({
    where: {
      OR: [{ itemCode: code }, { shortBarcodeId: code }],
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

  if (!item) {
    return NextResponse.json({ error: "No matching physical item found." }, { status: 404 });
  }

  return NextResponse.json(item);
}
