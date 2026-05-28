import { NextResponse } from "next/server";
import { cleanCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const body = await request.json();
  const brandCode = cleanCode(String(body.brandCode || "CAE"));
  const currency = cleanCode(String(body.currency || "USD"));
  const defaultDropCode = cleanCode(String(body.defaultDropCode || "D001"));
  const defaultLowStockThreshold = Number(body.defaultLowStockThreshold ?? 2);
  const labelWidth = String(body.labelWidth || "2in").trim();
  const labelHeight = String(body.labelHeight || "1in").trim();

  if (!brandCode || !currency || !defaultDropCode) {
    return NextResponse.json({ error: "Brand code, currency, and drop code are required." }, { status: 400 });
  }

  if (!Number.isInteger(defaultLowStockThreshold) || defaultLowStockThreshold < 0) {
    return NextResponse.json({ error: "Low stock threshold must be zero or higher." }, { status: 400 });
  }

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      brandCode,
      currency,
      defaultLowStockThreshold,
      labelWidth,
      labelHeight,
      defaultDropCode,
    },
    create: {
      id: "default",
      brandCode,
      currency,
      defaultLowStockThreshold,
      labelWidth,
      labelHeight,
      defaultDropCode,
    },
  });

  await prisma.activityLog.create({
    data: { type: "UPDATED_SETTINGS", itemName: "Settings", note: "Updated local defaults" },
  });

  return NextResponse.json(settings);
}
