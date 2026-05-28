"use client";

import JsBarcode from "jsbarcode";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

const labelStatuses = ["ORDERED", "IN_STOCK", "SOLD", "RETURNED", "DAMAGED", "LOST"] as const;

type Variant = {
  id: string;
  size: string;
  color: string;
  quantity: number;
  lowStockThreshold: number;
  dropCode: string;
  sku: string;
  barcode: string;
  items: InventoryItem[];
  product: {
    name: string;
  };
};

type InventoryItem = {
  id: string;
  itemCode: string;
  shortBarcodeId: string | null;
  status: string;
};

type LabelItem = {
  key: string;
  variant: Variant;
  item: InventoryItem;
};

type LabelsClientProps = {
  variants: Variant[];
  settings: {
    labelWidth: string;
    labelHeight: string;
  };
};

export default function LabelsClient({ variants, settings }: LabelsClientProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, boolean>>({
    ORDERED: true,
    IN_STOCK: true,
    SOLD: false,
    RETURNED: false,
    DAMAGED: false,
    LOST: false,
  });

  const totalSelected = useMemo(
    () => Object.values(counts).reduce((sum, count) => sum + Math.max(0, count || 0), 0),
    [counts],
  );

  const printableItemsByVariant = useMemo(() => {
    return new Map<string, InventoryItem[]>(
      variants.map((variant) => [
        variant.id,
        variant.items.filter((item) => selectedStatuses[item.status]),
      ]),
    );
  }, [selectedStatuses, variants]);

  const firstPrintableLabel = (() => {
    for (const variant of variants) {
      const item = printableItemsByVariant.get(variant.id)?.[0];
      if (item) {
        return {
          key: item.id,
          variant,
          item,
        };
      }
    }

    return null;
  })();

  useEffect(() => {
    labels.forEach((label) => {
      const element = document.getElementById(`barcode-${label.key}`);
      if (!element) return;

      JsBarcode(element, label.item.shortBarcodeId || label.item.itemCode, {
        format: "CODE128",
        displayValue: false,
        margin: 8,
        width: 3,
        height: 50,
      });
    });
  }, [labels]);

  function updateCount(variantId: string, value: string) {
    const nextValue = Math.max(0, Number(value) || 0);
    setCounts((current) => ({
      ...current,
      [variantId]: nextValue,
    }));
  }

  function setAllToQuantity() {
    const nextCounts: Record<string, number> = {};
    variants.forEach((variant) => {
      nextCounts[variant.id] = printableItemsByVariant.get(variant.id)?.length || 0;
    });
    setCounts(nextCounts);
  }

  function clearAll() {
    setCounts({});
    setLabels([]);
  }

  function generateLabels() {
    const nextLabels: LabelItem[] = [];

    variants.forEach((variant) => {
      const printableItems = printableItemsByVariant.get(variant.id) || [];
      const count = Math.min(Math.max(0, counts[variant.id] || 0), printableItems.length);
      for (let index = 0; index < count; index += 1) {
        nextLabels.push({
          key: printableItems[index].id,
          variant,
          item: printableItems[index],
        });
      }
    });

    setLabels(nextLabels);
  }

  function testPrintOneLabel() {
    if (!firstPrintableLabel) return;

    setLabels([firstPrintableLabel]);
    window.setTimeout(() => window.print(), 150);
  }

  return (
    <>
      <section className="panel no-print">
        <div className="variant-title">
          <div>
            <h2>Variant Label Counts</h2>
            <p>{totalSelected} labels selected before generation.</p>
          </div>
          <div className="action-row">
            <button className="secondary" type="button" onClick={setAllToQuantity}>
              Use Filtered Qty
            </button>
            <button className="secondary" type="button" onClick={clearAll}>
              Clear
            </button>
            <button
              className="secondary"
              type="button"
              disabled={!firstPrintableLabel}
              onClick={testPrintOneLabel}
            >
              Test Print One
            </button>
            <button type="button" onClick={generateLabels}>
              Generate Labels
            </button>
          </div>
        </div>
        <div className="filter-row">
          {labelStatuses.map((status) => (
            <label className="inline-check" key={status}>
              <input
                checked={Boolean(selectedStatuses[status])}
                type="checkbox"
                onChange={(event) =>
                  setSelectedStatuses((current) => ({
                    ...current,
                    [status]: event.target.checked,
                  }))
                }
              />
              {status}
            </label>
          ))}
        </div>

        {variants.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Drop</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Items</th>
                  <th>Labels</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id}>
                    <td>{variant.product.name}</td>
                    <td>{variant.color}</td>
                    <td>{variant.size}</td>
                    <td>{variant.dropCode}</td>
                    <td className="sku">{variant.sku}</td>
                    <td>
                      <span
                        className={`pill ${
                          variant.quantity <= variant.lowStockThreshold ? "low" : ""
                        }`}
                      >
                        {variant.items.filter((item) => item.status === "IN_STOCK").length}
                      </span>
                    </td>
                    <td>{printableItemsByVariant.get(variant.id)?.length || 0}</td>
                    <td>
                      <input
                        className="label-count"
                        min="0"
                        type="number"
                        value={counts[variant.id] || ""}
                        onChange={(event) => updateCount(variant.id, event.target.value)}
                        aria-label={`Labels for ${variant.sku}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No variants yet. Add product variants before printing labels.</div>
        )}
      </section>

      <section className="panel label-preview-panel">
        <div className="variant-title no-print">
          <div>
            <h2>Print Sheet</h2>
            <p>{labels.length} generated labels ready to print.</p>
          </div>
          <button type="button" disabled={!labels.length} onClick={() => window.print()}>
            Print
          </button>
        </div>

        {labels.length ? (
          <div
            className="label-sheet"
            style={
              {
                "--label-width": settings.labelWidth,
                "--label-height": settings.labelHeight,
              } as CSSProperties
            }
          >
            {labels.map((label) => (
              <article className="barcode-label" key={label.key}>
                <div className="label-product">{label.variant.product.name}</div>
                <div className="label-details">
                  {label.variant.color} / {label.variant.size} / {label.variant.dropCode}
                </div>
                <svg
                  id={`barcode-${label.key}`}
                  className="label-barcode"
                  role="img"
                  aria-label={`CODE128 barcode for ${label.item.shortBarcodeId || label.item.itemCode}`}
                />
                <div className="label-short-code">{label.item.shortBarcodeId || "NO SHORT ID"}</div>
                <div className="label-item-code">{label.item.itemCode}</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty no-print">Generate labels to preview the printable sheet.</div>
        )}
      </section>
    </>
  );
}
