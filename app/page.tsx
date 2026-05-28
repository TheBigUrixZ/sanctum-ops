import Link from "next/link";
import { calculateBusinessTotals } from "@/lib/business";
import { itemCounts } from "@/lib/inventory-items";
import { prisma } from "@/lib/prisma";
import { centsToDollars } from "@/lib/codes";

export default async function DashboardPage() {
  const [productCount, variantCount, variants, allVariants, movements, sales, expenses, activities] =
    await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.productVariant.findMany({
      include: { product: true, items: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.productVariant.findMany({
      include: { product: true, items: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.inventoryMovement.findMany({
      include: {
        variant: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.sale.findMany({
      include: { variant: { include: { product: true } } },
      orderBy: { soldAt: "desc" },
    }),
    prisma.expense.findMany({ orderBy: { spentAt: "desc" } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  const totals = calculateBusinessTotals({ variants: allVariants, sales, expenses });
  const lowStockVariants = allVariants
    .filter((variant) => itemCounts(variant.items).inStock <= variant.lowStockThreshold)
    .slice(0, 8);

  return (
    <div className="grid">
      <header className="page-head">
        <div>
          <p className="eyebrow">Local V1</p>
          <h1>Dashboard</h1>
          <p>Track what is in stock, what moved, and what needs attention.</p>
        </div>
        <Link className="button" href="/inventory">
          Inventory
        </Link>
      </header>

      <section className="grid stats">
        <div className="stat">
          <span>Products</span>
          <strong>{productCount}</strong>
        </div>
        <div className="stat">
          <span>Variants</span>
          <strong>{variantCount}</strong>
        </div>
        <div className="stat">
          <span>Units On Hand</span>
          <strong>{totals.totalInventoryUnits}</strong>
        </div>
        <div className="stat">
          <span>Low Stock</span>
          <strong>{totals.lowStockCount}</strong>
        </div>
      </section>

      <section className="grid stats">
        <div className="stat">
          <span>Inventory Cost</span>
          <strong>${centsToDollars(totals.totalInventoryCostValue)}</strong>
        </div>
        <div className="stat">
          <span>Incoming Cost</span>
          <strong>${centsToDollars(totals.expectedIncomingInventoryCost)}</strong>
        </div>
        <div className="stat">
          <span>Potential Revenue</span>
          <strong>${centsToDollars(totals.totalPotentialRevenue)}</strong>
        </div>
        <div className="stat">
          <span>Potential Profit</span>
          <strong>${centsToDollars(totals.totalPotentialProfit)}</strong>
        </div>
        <div className="stat">
          <span>Real Net Profit</span>
          <strong>${centsToDollars(totals.realNetProfit)}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Low Stock Variants</h2>
        {lowStockVariants.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Drop</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStockVariants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="sku">{variant.sku}</td>
                    <td>{variant.product.name}</td>
                    <td>{variant.color}</td>
                    <td>{variant.size}</td>
                    <td>{variant.dropCode}</td>
                    <td>
                    <StockBadge
                      quantity={itemCounts(variant.items).inStock}
                      threshold={variant.lowStockThreshold}
                    />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No low stock variants right now.</div>
        )}
      </section>

      <section className="panel">
        <h2>Recent Variants</h2>
        {variants.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Drop</th>
                  <th>Qty</th>
                  <th>Sell</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="sku">{variant.sku}</td>
                    <td>{variant.product.name}</td>
                    <td>{variant.color}</td>
                    <td>{variant.size}</td>
                    <td>{variant.dropCode}</td>
                    <td>
                      <StockBadge
                        quantity={itemCounts(variant.items).inStock}
                        threshold={variant.lowStockThreshold}
                      />
                    </td>
                    <td>${centsToDollars(variant.sellPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No variants yet. Add your first product variant to begin.</div>
        )}
      </section>

      <section className="panel">
        <h2>Activity Log</h2>
        {activities.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>SKU / Item</th>
                  <th>Qty</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.createdAt.toLocaleString()}</td>
                    <td>{activity.type.replaceAll("_", " ")}</td>
                    <td className="sku">{activity.sku || activity.itemName || ""}</td>
                    <td>{activity.quantity || ""}</td>
                    <td>{activity.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Activity appears after stock, sales, expenses, or edits happen.</div>
        )}
      </section>

      <section className="panel">
        <h2>Movement History</h2>
        {movements.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.createdAt.toLocaleString()}</td>
                    <td>{movement.type.replaceAll("_", " ")}</td>
                    <td className="sku">{movement.variant.sku}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Movement history appears after stock is added or sold.</div>
        )}
      </section>
    </div>
  );
}

function StockBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  if (quantity <= 0) {
    return <span className="pill out">Out of stock</span>;
  }

  if (quantity <= threshold) {
    return <span className="pill low">Low: {quantity}</span>;
  }

  return <span className="pill">{quantity}</span>;
}
