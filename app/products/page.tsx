import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { centsToDollars } from "@/lib/codes";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid">
      <header className="page-head">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
          <p>Every product type and variant currently tracked in your local database.</p>
        </div>
        <Link className="button" href="/products/new">
          Add Product
        </Link>
      </header>

      {products.length ? (
        products.map((product) => (
          <section className="panel" key={product.id}>
            <div className="variant-title">
              <div>
                <h2>{product.name}</h2>
                <p className="sku">{product.code}</p>
              </div>
              <span className="pill">{product.variants.length} variants</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Drop</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Sell</th>
                    <th>Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="sku">{variant.sku}</td>
                      <td>{variant.color}</td>
                      <td>{variant.size}</td>
                      <td>{variant.dropCode}</td>
                      <td>
                        <span
                          className={`pill ${
                            variant.quantity <= variant.lowStockThreshold ? "low" : ""
                          }`}
                        >
                          {variant.quantity}
                        </span>
                      </td>
                      <td>${centsToDollars(variant.cost)}</td>
                      <td>${centsToDollars(variant.sellPrice)}</td>
                      <td className="sku">{variant.barcode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      ) : (
        <div className="empty">No products yet. Add your first product variant.</div>
      )}
    </div>
  );
}
