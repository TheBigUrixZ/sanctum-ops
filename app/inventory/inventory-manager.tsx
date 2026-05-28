"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { colorCodes, productCodes } from "@/lib/codes";
import { itemCounts } from "@/lib/inventory-items";

type Product = {
  id: string;
  name: string;
  code: string;
  variants: Variant[];
};

type Variant = {
  id: string;
  productId: string;
  size: string;
  color: string;
  quantity: number;
  cost: number;
  sellPrice: number;
  lowStockThreshold: number;
  notes: string | null;
  imageUrl: string | null;
  items: InventoryItem[];
  dropCode: string;
  sku: string;
  barcode: string;
  movements?: unknown[];
  sales?: unknown[];
};

type InventoryItem = {
  id: string;
  itemCode: string;
  shortBarcodeId: string | null;
  status: string;
  receivedAt: Date | string;
  soldAt: Date | string | null;
  packedAt: Date | string | null;
  notes: string | null;
};

type ModalState =
  | { type: "stock"; mode: "ADD" | "REMOVE"; variant: Variant; product: Product }
  | { type: "edit"; variant: Variant; product: Product }
  | { type: "deleteVariant"; variant: Variant; product: Product }
  | { type: "deleteProduct"; product: Product }
  | { type: "items"; variant: Variant; product: Product }
  | null;

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function InventoryManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const productOptions = useMemo(() => Object.keys(productCodes), []);
  const colorOptions = useMemo(() => Object.keys(colorCodes), []);

  async function submitStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.type !== "stock") return;
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");

    const response = await fetch(`/api/variants/${modal.variant.id}/movement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: modal.mode,
        quantity: Number(formData.get("quantity")),
        note: String(formData.get("note") || ""),
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not update stock.");
      return;
    }

    setMessage(modal.mode === "ADD" ? "Bulk inventory ordered. Print labels, then receive items by scan." : "Stock removed.");
    setModal(null);
    router.refresh();
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.type !== "edit") return;
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");

    const response = await fetch(`/api/variants/${modal.variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not save variant.");
      return;
    }

    setMessage("Variant updated.");
    setModal(null);
    router.refresh();
  }

  async function deleteVariant() {
    if (!modal || modal.type !== "deleteVariant") return;
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/variants/${modal.variant.id}`, { method: "DELETE" });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not delete variant.");
      return;
    }

    setMessage(
      `Variant deleted. Removed ${data.deletedItems} physical items, ${data.deletedMovements} movement records, and ${data.deletedSales} linked sales.`,
    );
    setModal(null);
    router.refresh();
  }

  async function deleteProduct() {
    if (!modal || modal.type !== "deleteProduct") return;
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/products/${modal.product.id}`, { method: "DELETE" });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not delete product.");
      return;
    }

    setMessage(
      `Product deleted. Removed ${data.deletedVariants} variants, ${data.deletedItems} physical items, ${data.deletedMovements} movement records, and ${data.deletedSales} linked sales.`,
    );
    setModal(null);
    router.refresh();
  }

  return (
    <div className="grid">
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="error">{error}</div> : null}

      <section className="panel">
        <label>
          Search inventory
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search variant SKU or unique item code"
          />
        </label>
      </section>

      {products.length ? (
        products.map((product) => {
          const filteredVariants = product.variants.filter((variant) => {
            const normalized = query.trim().toUpperCase();
            if (!normalized) return true;
            return (
              product.name.toUpperCase().includes(normalized) ||
              variant.sku.includes(normalized) ||
              variant.color.toUpperCase().includes(normalized) ||
              variant.size.toUpperCase().includes(normalized) ||
              variant.dropCode.toUpperCase().includes(normalized) ||
              variant.items.some(
                (item) =>
                  item.itemCode.includes(normalized) ||
                  Boolean(item.shortBarcodeId?.includes(normalized)),
              )
            );
          });

          if (!filteredVariants.length) return null;

          return (
          <section className="panel" key={product.id}>
            <div className="variant-title inventory-product-head">
              <div>
                <h2>{product.name}</h2>
                <p className="sku">{product.code}</p>
              </div>
              <div className="action-row">
                <span className="pill">{product.variants.length} variants</span>
                <button
                  className="danger"
                  type="button"
                  onClick={() => setModal({ type: "deleteProduct", product })}
                >
                  Delete Product
                </button>
              </div>
            </div>

            {product.variants.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Color</th>
                      <th>Size</th>
                      <th>Drop</th>
                      <th>Available</th>
                      <th>Cost</th>
                      <th>Sell</th>
                      <th>Low</th>
                      <th>Ordered</th>
                      <th>Total</th>
                      <th>Sold</th>
                      <th>Returned</th>
                      <th>Damaged/Lost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVariants.map((variant) => {
                      const counts = itemCounts(variant.items);
                      return (
                      <tr key={variant.id}>
                        <td>
                          <div className="inventory-item-cell">
                            <ImagePlaceholder imageUrl={variant.imageUrl} name={variant.sku} />
                            <span className="sku">{variant.sku}</span>
                          </div>
                        </td>
                        <td>{variant.color}</td>
                        <td>{variant.size}</td>
                        <td>{variant.dropCode}</td>
                        <td>
                          <StockBadge quantity={counts.inStock} threshold={variant.lowStockThreshold} />
                        </td>
                        <td>${centsToInput(variant.cost)}</td>
                        <td>${centsToInput(variant.sellPrice)}</td>
                        <td>{variant.lowStockThreshold}</td>
                        <td>{counts.ordered}</td>
                        <td>{counts.total}</td>
                        <td>{counts.sold}</td>
                        <td>{counts.returned}</td>
                        <td>{counts.damagedLost}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => setModal({ type: "items", variant, product })}
                            >
                              Details
                            </button>
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => setModal({ type: "edit", variant, product })}
                            >
                              Edit
                            </button>
                            <button
                              className="success"
                              type="button"
                              onClick={() =>
                                setModal({ type: "stock", mode: "ADD", variant, product })
                              }
                            >
                              Add Bulk Order
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setModal({ type: "stock", mode: "REMOVE", variant, product })
                              }
                            >
                              Remove Stock
                            </button>
                            <button
                              className="danger"
                              type="button"
                              onClick={() =>
                                setModal({ type: "deleteVariant", variant, product })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">This product has no variants.</div>
            )}
          </section>
        );
        })
      ) : (
        <div className="empty">No variants yet. Add your first item on this page.</div>
      )}

      {modal?.type === "stock" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal panel form" onSubmit={submitStock}>
            <h2>{modal.mode === "ADD" ? "Add Bulk Inventory" : "Remove Stock"}</h2>
            <p className="sku">{modal.variant.sku}</p>
            <label>
              {modal.mode === "ADD" ? "Quantity Ordered" : "Quantity"}
              <input min="1" name="quantity" type="number" defaultValue="1" required />
            </label>
            <label>
              Note
              <textarea name="note" rows={3} placeholder="Optional" />
            </label>
            <div className="action-row">
              <button type="submit" disabled={busy}>
                Save
              </button>
              <button className="secondary" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {modal?.type === "edit" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal panel form" onSubmit={submitEdit}>
            <h2>Edit Variant</h2>
            <p>
              Changing product, color, size, or drop code regenerates SKU and barcode. Duplicate
              SKUs are blocked.
            </p>
            <div className="form-grid">
              <label>
                Product
                <select name="productName" defaultValue={modal.product.name}>
                  {productOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Color
                <select name="color" defaultValue={modal.variant.color}>
                  {colorOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Size
                <input name="size" defaultValue={modal.variant.size} required />
              </label>
              <label>
                Drop Code
                <input name="dropCode" defaultValue={modal.variant.dropCode} required />
              </label>
              <label>
                Cost
                <input
                  min="0"
                  name="cost"
                  step="0.01"
                  type="number"
                  defaultValue={centsToInput(modal.variant.cost)}
                  required
                />
              </label>
              <label>
                Sell Price
                <input
                  min="0"
                  name="sellPrice"
                  step="0.01"
                  type="number"
                  defaultValue={centsToInput(modal.variant.sellPrice)}
                  required
                />
              </label>
              <label>
                Low Stock Threshold
                <input
                  min="0"
                  name="lowStockThreshold"
                  type="number"
                  defaultValue={modal.variant.lowStockThreshold}
                  required
                />
              </label>
            </div>
              <label>
                Image URL
                <input name="imageUrl" defaultValue={modal.variant.imageUrl || ""} />
              </label>
              <label>
                Notes
                <textarea name="notes" rows={3} defaultValue={modal.variant.notes || ""} />
              </label>
            <div className="sku-preview">
              Current SKU
              <strong>{modal.variant.sku}</strong>
            </div>
            <div className="action-row">
              <button type="submit" disabled={busy}>
                Save Variant
              </button>
              <button className="secondary" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {modal?.type === "deleteVariant" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal panel form">
            <h2>Delete Variant?</h2>
            <p>
              This deletes {modal.variant.sku}. Because the database uses cascade deletes, related
              physical item records, movement history, and linked sale records for this variant
              will also be removed.
            </p>
            <div className="action-row">
              <button className="danger" type="button" disabled={busy} onClick={deleteVariant}>
                Delete Variant
              </button>
              <button className="secondary" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modal?.type === "deleteProduct" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal panel form">
            <h2>Delete Product?</h2>
            <p>
              This deletes {modal.product.name} and all variants under it. Related movement history
              physical items, movement history, and linked sales for those variants will also be
              removed by database cascade.
            </p>
            <div className="action-row">
              <button className="danger" type="button" disabled={busy} onClick={deleteProduct}>
                Delete Product
              </button>
              <button className="secondary" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modal?.type === "items" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal panel form">
            <div className="variant-title">
              <div>
                <h2>Physical Items</h2>
                <p className="sku">{modal.variant.sku}</p>
              </div>
              <button className="secondary" type="button" onClick={() => setModal(null)}>
                Close
              </button>
            </div>
            {modal.variant.items.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Barcode ID</th>
                      <th>Status</th>
                      <th>Received</th>
                      <th>Sold</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modal.variant.items.map((item) => (
                      <tr key={item.id}>
                        <td className="sku">{item.itemCode}</td>
                        <td className="sku">{item.shortBarcodeId || ""}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td>{new Date(item.receivedAt).toLocaleDateString()}</td>
                        <td>{item.soldAt ? new Date(item.soldAt).toLocaleDateString() : ""}</td>
                        <td>{item.notes || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">No physical item records yet. Add bulk inventory to generate item codes.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImagePlaceholder({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  if (imageUrl) {
    return (
      <div
        className="image-thumb"
        role="img"
        aria-label={name}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    );
  }

  return <div className="image-thumb placeholder">IMG</div>;
}

function StockBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  if (quantity <= 0) return <span className="pill out">Out</span>;
  if (quantity <= threshold) return <span className="pill low">Low: {quantity}</span>;
  return <span className="pill">{quantity}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "IN_STOCK") return <span className="pill">IN_STOCK</span>;
  if (status === "ORDERED" || status === "RETURNED") return <span className="pill low">{status}</span>;
  if (status === "SOLD" || status === "DAMAGED" || status === "LOST") {
    return <span className="pill out">{status}</span>;
  }
  return <span className="pill low">{status}</span>;
}
