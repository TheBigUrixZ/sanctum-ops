import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import ProductForm from "../products/new/product-form";
import InventoryManager from "./inventory-manager";

export default async function InventoryPage() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      include: {
        variants: {
          include: {
            items: {
              orderBy: { itemCode: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getSettings(),
  ]);

  return (
    <div className="grid">
      <header className="page-head">
        <div>
          <p className="eyebrow">Stockroom</p>
          <h1>Inventory</h1>
          <p>Enter bulk orders, print short barcode labels, then receive each item by scan when it arrives.</p>
        </div>
      </header>

      <section className="inventory-layout">
        <div>
          <ProductForm settings={settings} />
        </div>
        <InventoryManager products={products} />
      </section>
    </div>
  );
}
