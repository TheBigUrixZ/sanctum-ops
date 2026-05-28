import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ type: string }> };

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

function csvResponse(filename: string, csv: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(_request: Request, { params }: Params) {
  const { type } = await params;

  if (type === "products") {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return csvResponse(
      "products.csv",
      toCsv(
        ["id", "name", "code", "description", "imageUrl", "createdAt", "updatedAt"],
        rows.map((row) => [row.id, row.name, row.code, row.description, row.imageUrl, row.createdAt, row.updatedAt]),
      ),
    );
  }

  if (type === "variants") {
    const rows = await prisma.productVariant.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } });
    return csvResponse(
      "variants.csv",
      toCsv(
        ["id", "product", "sku", "barcode", "color", "size", "dropCode", "quantity", "cost", "sellPrice", "lowStockThreshold", "notes", "imageUrl"],
        rows.map((row) => [
          row.id,
          row.product.name,
          row.sku,
          row.barcode,
          row.color,
          row.size,
          row.dropCode,
          row.quantity,
          row.cost,
          row.sellPrice,
          row.lowStockThreshold,
          row.notes,
          row.imageUrl,
        ]),
      ),
    );
  }

  if (type === "movements") {
    const rows = await prisma.inventoryMovement.findMany({ include: { variant: true }, orderBy: { createdAt: "desc" } });
    return csvResponse(
      "inventory-movements.csv",
      toCsv(
        ["id", "sku", "type", "quantity", "note", "createdAt"],
        rows.map((row) => [row.id, row.variant.sku, row.type, row.quantity, row.note, row.createdAt]),
      ),
    );
  }

  if (type === "items") {
    const rows = await prisma.inventoryItem.findMany({
      include: { variant: { include: { product: true } } },
      orderBy: { itemCode: "asc" },
    });
    return csvResponse(
      "inventory-items.csv",
      toCsv(
        ["id", "product", "variantSku", "itemCode", "shortBarcodeId", "status", "receivedAt", "soldAt", "packedAt", "notes"],
        rows.map((row) => [
          row.id,
          row.variant.product.name,
          row.variant.sku,
          row.itemCode,
          row.shortBarcodeId,
          row.status,
          row.receivedAt,
          row.soldAt,
          row.packedAt,
          row.notes,
        ]),
      ),
    );
  }

  if (type === "sales") {
    const rows = await prisma.sale.findMany({ orderBy: { soldAt: "desc" } });
    return csvResponse(
      "sales.csv",
      toCsv(
        ["id", "sku", "itemCode", "quantity", "salePrice", "grossRevenue", "productCost", "fees", "shippingCost", "netProfit", "platform", "note", "soldAt"],
        rows.map((row) => [row.id, row.sku, row.itemCode, row.quantity, row.salePrice, row.grossRevenue, row.productCost, row.fees, row.shippingCost, row.netProfit, row.platform, row.note, row.soldAt]),
      ),
    );
  }

  if (type === "expenses") {
    const rows = await prisma.expense.findMany({ orderBy: { spentAt: "desc" } });
    return csvResponse(
      "expenses.csv",
      toCsv(
        ["id", "name", "category", "amount", "spentAt", "note", "createdAt"],
        rows.map((row) => [row.id, row.name, row.category, row.amount, row.spentAt, row.note, row.createdAt]),
      ),
    );
  }

  if (type === "drops") {
    const rows = await prisma.drop.findMany({ orderBy: { createdAt: "desc" } });
    return csvResponse(
      "drops.csv",
      toCsv(
        ["id", "name", "code", "releaseDate", "notes", "createdAt", "updatedAt"],
        rows.map((row) => [row.id, row.name, row.code, row.releaseDate, row.notes, row.createdAt, row.updatedAt]),
      ),
    );
  }

  return NextResponse.json({ error: "Unknown export type." }, { status: 404 });
}
