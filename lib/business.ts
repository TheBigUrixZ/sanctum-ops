import type { Prisma } from "@prisma/client";
import { itemCounts } from "@/lib/inventory-items";

export const expenseCategories = [
  "Samples",
  "Blanks",
  "Printing",
  "Embroidery",
  "Labels",
  "Packaging",
  "Shipping Supplies",
  "Ads",
  "Photoshoot",
  "Designer",
  "Website",
  "Software",
  "Other",
];

type VariantWithProduct = Prisma.ProductVariantGetPayload<{
  include: { product: true; items: true };
}>;

type SaleWithVariant = Prisma.SaleGetPayload<{
  include: { variant: { include: { product: true } } };
}>;

type Expense = Prisma.ExpenseGetPayload<object>;
type Drop = Prisma.DropGetPayload<object>;

export function calculateBusinessTotals(input: {
  variants: VariantWithProduct[];
  sales: SaleWithVariant[];
  expenses: Expense[];
}) {
  const totalInventoryUnits = input.variants.reduce(
    (sum, variant) => sum + itemCounts(variant.items).inStock,
    0,
  );
  const totalInventoryCostValue = input.variants.reduce(
    (sum, variant) => sum + itemCounts(variant.items).inStock * variant.cost,
    0,
  );
  const expectedIncomingInventoryCost = input.variants.reduce(
    (sum, variant) => sum + itemCounts(variant.items).ordered * variant.cost,
    0,
  );
  const totalPotentialRevenue = input.variants.reduce(
    (sum, variant) => sum + itemCounts(variant.items).inStock * variant.sellPrice,
    0,
  );
  const totalPotentialProfit = totalPotentialRevenue - totalInventoryCostValue;
  const totalSalesRevenue = input.sales.reduce((sum, sale) => sum + sale.grossRevenue, 0);
  const totalExpenses = input.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const salesNetProfit = input.sales.reduce((sum, sale) => sum + sale.netProfit, 0);
  const realNetProfit = salesNetProfit - totalExpenses;
  const totalUnitsSold = input.variants.reduce((sum, variant) => sum + itemCounts(variant.items).sold, 0);
  const lowStockCount = input.variants.filter(
    (variant) => itemCounts(variant.items).inStock <= variant.lowStockThreshold,
  ).length;

  return {
    totalInventoryUnits,
    totalInventoryCostValue,
    expectedIncomingInventoryCost,
    totalPotentialRevenue,
    totalPotentialProfit,
    totalSalesRevenue,
    totalExpenses,
    realNetProfit,
    totalUnitsSold,
    lowStockCount,
  };
}

export function calculateDropStats(input: {
  drop: Drop;
  variants: VariantWithProduct[];
  sales: SaleWithVariant[];
}) {
  const variants = input.variants.filter((variant) => variant.dropCode === input.drop.code);
  const sales = input.sales.filter((sale) => sale.variant.dropCode === input.drop.code);
  const remainingUnits = variants.reduce((sum, variant) => sum + itemCounts(variant.items).inStock, 0);
  const unitsSold = variants.reduce((sum, variant) => sum + itemCounts(variant.items).sold, 0);
  const totalUnits = remainingUnits + unitsSold;
  const inventoryCost = variants.reduce((sum, variant) => sum + itemCounts(variant.items).inStock * variant.cost, 0);
  const potentialRevenue = variants.reduce(
    (sum, variant) => sum + itemCounts(variant.items).inStock * variant.sellPrice,
    0,
  );
  const potentialProfit = potentialRevenue - inventoryCost;
  const salesRevenue = sales.reduce((sum, sale) => sum + sale.grossRevenue, 0);

  return {
    totalUnits,
    unitsSold,
    inventoryCost,
    potentialRevenue,
    potentialProfit,
    salesRevenue,
    remainingUnits,
  };
}
