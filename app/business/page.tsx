import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { calculateBusinessTotals, calculateDropStats } from "@/lib/business";
import { centsToDollars } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { DropForm, ExpenseForm, SaleForm } from "./business-forms";
import { DeleteExpenseButton, DeleteSaleButton } from "./delete-buttons";

export const dynamic = "force-dynamic";

const tabs = ["Overview", "Drops", "Sales", "Expenses"] as const;

type TabName = (typeof tabs)[number];
type SaleRow = Prisma.SaleGetPayload<{
  include: { variant: { include: { product: true } } };
}>;
type ExpenseRow = Prisma.ExpenseGetPayload<object>;

type BusinessPageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

function money(cents: number) {
  return `$${centsToDollars(cents)}`;
}

export default async function BusinessPage({ searchParams }: BusinessPageProps) {
  const params = await searchParams;
  const activeTab = tabs.includes(params.tab as TabName) ? (params.tab as TabName) : "Overview";
  const [variants, drops, sales, expenses, activities] = await Promise.all([
    prisma.productVariant.findMany({
      include: { product: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.drop.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({
      include: { variant: { include: { product: true } } },
      orderBy: { soldAt: "desc" },
    }),
    prisma.expense.findMany({ orderBy: { spentAt: "desc" } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const totals = calculateBusinessTotals({ variants, sales, expenses });
  const recentSales = sales.slice(0, 8);
  const recentExpenses = expenses.slice(0, 8);

  return (
    <div className="grid">
      <header className="page-head">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Business</h1>
          <p>Track drops, manual sales, expenses, and brand-level profit locally.</p>
        </div>
      </header>

      <div className="tabs">
        {tabs.map((tab) => (
          <Link
            className={activeTab === tab ? "active" : ""}
            href={`/business?tab=${encodeURIComponent(tab)}`}
            key={tab}
          >
            {tab}
          </Link>
        ))}
      </div>

      {activeTab === "Overview" ? (
        <div className="grid">
          <section className="grid business-stats">
            <div className="stat">
              <span>Total Inventory Units</span>
              <strong>{totals.totalInventoryUnits}</strong>
            </div>
            <div className="stat">
              <span>Inventory Cost Value</span>
              <strong>{money(totals.totalInventoryCostValue)}</strong>
            </div>
            <div className="stat">
              <span>Expected Incoming Cost</span>
              <strong>{money(totals.expectedIncomingInventoryCost)}</strong>
            </div>
            <div className="stat">
              <span>Potential Revenue</span>
              <strong>{money(totals.totalPotentialRevenue)}</strong>
            </div>
            <div className="stat">
              <span>Potential Profit</span>
              <strong>{money(totals.totalPotentialProfit)}</strong>
            </div>
            <div className="stat">
              <span>Sales Revenue</span>
              <strong>{money(totals.totalSalesRevenue)}</strong>
            </div>
            <div className="stat">
              <span>Expenses</span>
              <strong>{money(totals.totalExpenses)}</strong>
            </div>
            <div className="stat">
              <span>Real Net Profit</span>
              <strong>{money(totals.realNetProfit)}</strong>
            </div>
            <div className="stat">
              <span>Units Sold</span>
              <strong>{totals.totalUnitsSold}</strong>
            </div>
            <div className="stat">
              <span>Low Stock Variants</span>
              <strong>{totals.lowStockCount}</strong>
            </div>
          </section>

          <section className="panel">
            <h2>Recent Sales</h2>
            <BusinessSalesTable sales={recentSales} />
          </section>

          <section className="panel">
            <h2>Recent Expenses</h2>
            <BusinessExpensesTable expenses={recentExpenses} />
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
              <div className="empty">No activity yet.</div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "Drops" ? (
        <div className="grid">
          <DropForm />
          <section className="panel">
            <h2>Drops</h2>
            {drops.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Drop</th>
                      <th>Code</th>
                      <th>Release</th>
                      <th>Total Units</th>
                      <th>Sold</th>
                      <th>Inventory Cost</th>
                      <th>Potential Revenue</th>
                      <th>Potential Profit</th>
                      <th>Sales Revenue</th>
                      <th>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drops.map((drop) => {
                      const stats = calculateDropStats({ drop, variants, sales });
                      return (
                        <tr key={drop.id}>
                          <td>{drop.name}</td>
                          <td className="sku">{drop.code}</td>
                          <td>{drop.releaseDate ? drop.releaseDate.toLocaleDateString() : ""}</td>
                          <td>{stats.totalUnits}</td>
                          <td>{stats.unitsSold}</td>
                          <td>{money(stats.inventoryCost)}</td>
                          <td>{money(stats.potentialRevenue)}</td>
                          <td>{money(stats.potentialProfit)}</td>
                          <td>{money(stats.salesRevenue)}</td>
                          <td>{stats.remainingUnits}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">Create a drop to group variants by drop code.</div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "Sales" ? (
        <div className="grid">
          <SaleForm />
          <section className="panel">
            <h2>Sales</h2>
            <BusinessSalesTable sales={sales} />
          </section>
        </div>
      ) : null}

      {activeTab === "Expenses" ? (
        <div className="grid">
          <ExpenseForm />
          <section className="panel">
            <h2>Expenses</h2>
            <BusinessExpensesTable expenses={expenses} />
          </section>
        </div>
      ) : null}
    </div>
  );
}

function BusinessSalesTable({
  sales,
}: {
  sales: SaleRow[];
}) {
  if (!sales.length) {
    return <div className="empty">No sales logged yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>Revenue</th>
            <th>Net Profit</th>
            <th>Platform</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.soldAt.toLocaleDateString()}</td>
              <td>{sale.variant.product.name}</td>
              <td className="sku">{sale.sku}</td>
              <td>{sale.quantity}</td>
              <td>{money(sale.grossRevenue)}</td>
              <td>{money(sale.netProfit)}</td>
              <td>{sale.platform || ""}</td>
              <td>
                <DeleteSaleButton id={sale.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BusinessExpensesTable({
  expenses,
}: {
  expenses: ExpenseRow[];
}) {
  if (!expenses.length) {
    return <div className="empty">No expenses logged yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.spentAt.toLocaleDateString()}</td>
              <td>{expense.name}</td>
              <td>{expense.category}</td>
              <td>{money(expense.amount)}</td>
              <td>{expense.note || ""}</td>
              <td>
                <DeleteExpenseButton id={expense.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
