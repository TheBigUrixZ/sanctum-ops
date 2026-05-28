import type { Prisma } from "@prisma/client";

export const itemStatuses = [
  "ORDERED",
  "IN_STOCK",
  "SOLD",
  "RETURNED",
  "DAMAGED",
  "LOST",
] as const;
export type ItemStatus = (typeof itemStatuses)[number];

export function isItemStatus(value: string): value is ItemStatus {
  return itemStatuses.includes(value as ItemStatus);
}

export function itemCounts<T extends { status: string }>(items: T[]) {
  return {
    total: items.length,
    ordered: items.filter((item) => item.status === "ORDERED").length,
    inStock: items.filter((item) => item.status === "IN_STOCK").length,
    sold: items.filter((item) => item.status === "SOLD").length,
    returned: items.filter((item) => item.status === "RETURNED").length,
    damaged: items.filter((item) => item.status === "DAMAGED").length,
    lost: items.filter((item) => item.status === "LOST").length,
    damagedLost: items.filter((item) => item.status === "DAMAGED" || item.status === "LOST").length,
  };
}

export function nextItemNumber(itemCode: string, sku: string) {
  const prefix = `${sku}-`;
  if (!itemCode.startsWith(prefix)) return 0;
  const suffix = itemCode.slice(prefix.length);
  const parsed = Number(suffix);
  return Number.isInteger(parsed) ? parsed : 0;
}

export function shortBarcodeNumber(shortBarcodeId: string | null) {
  if (!shortBarcodeId?.startsWith("S")) return 0;
  const parsed = Number(shortBarcodeId.slice(1));
  return Number.isInteger(parsed) ? parsed : 0;
}

export function formatShortBarcodeId(number: number) {
  return `S${String(number).padStart(6, "0")}`;
}

export async function nextShortBarcodeStart(tx: Prisma.TransactionClient) {
  const existing = await tx.inventoryItem.findMany({
    select: { shortBarcodeId: true },
  });

  return (
    existing.reduce(
      (max, item) => Math.max(max, shortBarcodeNumber(item.shortBarcodeId)),
      0,
    ) + 1
  );
}

export async function generateInventoryItems(input: {
  tx: Prisma.TransactionClient;
  variantId: string;
  sku: string;
  quantity: number;
  status?: ItemStatus;
  receivedAt?: Date;
  notes?: string | null;
}) {
  const existing = await input.tx.inventoryItem.findMany({
    where: { variantId: input.variantId },
    select: { itemCode: true },
  });
  const highest = existing.reduce(
    (max, item) => Math.max(max, nextItemNumber(item.itemCode, input.sku)),
    0,
  );
  const nextShortBarcode = await nextShortBarcodeStart(input.tx);
  const now = new Date();
  const rows = Array.from({ length: input.quantity }, (_, index) => {
    const number = String(highest + index + 1).padStart(4, "0");
    return {
      variantId: input.variantId,
      itemCode: `${input.sku}-${number}`,
      shortBarcodeId: formatShortBarcodeId(nextShortBarcode + index),
      status: input.status || "ORDERED",
      receivedAt: input.receivedAt || now,
      notes: input.notes || null,
    };
  });

  if (rows.length) {
    await input.tx.inventoryItem.createMany({ data: rows });
  }

  return rows;
}
