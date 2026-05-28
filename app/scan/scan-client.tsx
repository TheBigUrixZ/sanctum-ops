"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { itemCounts } from "@/lib/inventory-items";

type ScanMode = "LOOKUP" | "RECEIVE" | "SOLD" | "RETURNED" | "DAMAGED" | "LOST";

type ScannedItem = {
  id: string;
  itemCode: string;
  shortBarcodeId: string | null;
  status: string;
  variant: {
    id: string;
    size: string;
    color: string;
    cost: number;
    sellPrice: number;
    dropCode: string;
    sku: string;
    product: { name: string; code: string };
    items: Array<{ status: string }>;
    movements: Array<{
      id: string;
      type: string;
      quantity: number;
      note: string | null;
      createdAt: string;
    }>;
  };
};

type RecentScan = {
  code: string;
  action: string;
  detail: string;
  at: string;
  ok: boolean;
};

const modes: Array<{ value: ScanMode; label: string }> = [
  { value: "LOOKUP", label: "Lookup Only" },
  { value: "RECEIVE", label: "Receive Inventory" },
  { value: "SOLD", label: "Sold" },
  { value: "RETURNED", label: "Return" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "LOST", label: "Lost" },
];

const likelyScanPattern = /^(?:S\d{6}|[A-Z0-9]+(?:-[A-Z0-9]+)+-\d{4})$/;

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ScanClient() {
  const [mode, setMode] = useState<ScanMode>("LOOKUP");
  const [code, setCode] = useState("");
  const [item, setItem] = useState<ScannedItem | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [salePrice, setSalePrice] = useState("");
  const [fees, setFees] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [platform, setPlatform] = useState("");
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedRef = useRef("");

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  function showToast(text: string, error = false) {
    setMessage(text);
    setIsError(error);
    if (!error) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 450);
    }
  }

  function rememberScan(nextCode: string, action: string, detail: string, ok: boolean) {
    setRecentScans((current) => [
      { code: nextCode, action, detail, ok, at: new Date().toLocaleTimeString() },
      ...current.slice(0, 11),
    ]);
  }

  async function lookupItem(value: string) {
    const response = await fetch(`/api/items/lookup?code=${encodeURIComponent(value)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "No matching physical item found.");
    }
    return data as ScannedItem;
  }

  async function applyMode(nextItem: ScannedItem) {
    if (mode === "LOOKUP") return nextItem;

    const response = await fetch(`/api/items/${nextItem.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: mode === "RECEIVE" ? "IN_STOCK" : mode,
        salePrice,
        fees,
        shippingCost,
        platform,
        note,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not update item status.");
    }

    return data as ScannedItem;
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const value = code.trim().toUpperCase();
    await submitCode(value);
  }

  async function submitCode(value: string) {
    if (!value || busy) return;

    const submitKey = `${mode}:${value}`;
    if (lastSubmittedRef.current === submitKey) return;
    lastSubmittedRef.current = submitKey;

    setBusy(true);
    setMessage("");
    setIsError(false);

    try {
      const found = await lookupItem(value);
      const updated = await applyMode(found);
      setItem(updated);
      const detail =
        mode === "LOOKUP"
          ? `Found ${updated.itemCode}.`
          : `${updated.itemCode} changed from ${found.status} to ${updated.status}.`;
      const toast =
        mode === "RECEIVE"
          ? `Received ${updated.itemCode} into inventory.`
          : detail;
      showToast(toast);
      rememberScan(updated.itemCode, modes.find((entry) => entry.value === mode)?.label || mode, detail, true);
      setCode("");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Scan failed.";
      showToast(text, true);
      rememberScan(value, modes.find((entry) => entry.value === mode)?.label || mode, text, false);
      setCode("");
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        lastSubmittedRef.current = "";
        inputRef.current?.focus();
      }, 0);
    }
  }

  useEffect(() => {
    const value = code.trim().toUpperCase();
    if (!value || busy || !likelyScanPattern.test(value)) return;

    const key = `${mode}:${value}`;
    const timer = window.setTimeout(() => {
      if (lastSubmittedRef.current === key) return;
      void submitCode(value);
    }, 300);

    return () => window.clearTimeout(timer);
  // submitCode intentionally reads the latest scan options from the current render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, code, mode]);

  const counts = item ? itemCounts(item.variant.items) : null;

  return (
    <div className={`grid scanner-shell ${flash ? "scan-flash" : ""}`}>
      <section className="panel form scanner-panel">
        <div>
          <p className="eyebrow">Scan Mode</p>
          <p>Use Receive Inventory when items arrive. Use Sold when packing/selling orders.</p>
          <div className="mode-grid">
            {modes.map((entry) => (
              <button
                className={mode === entry.value ? "success" : "secondary"}
                key={entry.value}
                type="button"
                onClick={() => setMode(entry.value)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "SOLD" ? (
          <div className="form-grid">
            <label>
              Sale Price Override
              <input value={salePrice} onChange={(event) => setSalePrice(event.target.value)} placeholder="Uses variant sell price" type="number" min="0" step="0.01" />
            </label>
            <label>
              Fees
              <input value={fees} onChange={(event) => setFees(event.target.value)} type="number" min="0" step="0.01" />
            </label>
            <label>
              Shipping Cost
              <input value={shippingCost} onChange={(event) => setShippingCost(event.target.value)} type="number" min="0" step="0.01" />
            </label>
            <label>
              Platform
              <input value={platform} onChange={(event) => setPlatform(event.target.value)} placeholder="Pop-up, IG, Website" />
            </label>
            <label>
              Note
              <input value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
        ) : null}

        <form className="form" onSubmit={submit}>
          <label>
            Unique item barcode
            <input
              ref={inputRef}
              className="scan-input"
              placeholder="S000001"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <div className="action-row">
            <button type="submit" disabled={busy}>
              {busy ? "Scanning..." : `Scan: ${modes.find((entry) => entry.value === mode)?.label}`}
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                setCode("");
                setMessage("");
                inputRef.current?.focus();
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {message ? <div className={isError ? "error" : "notice"}>{message}</div> : null}
      </section>

      {item ? (
        <section className="panel scan-result">
          <div className="variant-title">
            <div>
              <p className="eyebrow">{item.variant.product.name}</p>
              <h2 className="sku">{item.itemCode}</h2>
              <p>
                {item.variant.color} / {item.variant.size} / {item.variant.dropCode}
              </p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <div className="grid stats">
            <div className="stat">
              <span>Barcode ID</span>
              <strong className="sku">{item.shortBarcodeId || ""}</strong>
            </div>
            <div className="stat">
              <span>Variant SKU</span>
              <strong className="sku">{item.variant.sku}</strong>
            </div>
            <div className="stat">
              <span>Current Stock</span>
              <strong>{counts?.inStock || 0}</strong>
            </div>
            <div className="stat">
              <span>Cost</span>
              <strong>{money(item.variant.cost)}</strong>
            </div>
            <div className="stat">
              <span>Sell Price</span>
              <strong>{money(item.variant.sellPrice)}</strong>
            </div>
            <div className="stat">
              <span>Profit Each</span>
              <strong>{money(item.variant.sellPrice - item.variant.cost)}</strong>
            </div>
          </div>
        </section>
      ) : (
        <div className="empty">Choose a mode, then scan unique item barcodes continuously.</div>
      )}

      <section className="panel">
        <h2>Recent Scans</h2>
        {recentScans.length ? (
          <div className="recent-scans">
            {recentScans.map((scan, index) => (
              <div key={`${scan.code}-${scan.at}-${index}`}>
                <span className="sku">{scan.code}</span>
                <span>{scan.action}</span>
                <span>{scan.detail}</span>
                <span className={scan.ok ? "pill" : "pill out"}>{scan.ok ? "OK" : "Error"}</span>
                <span>{scan.at}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Recent scans will appear here.</div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "IN_STOCK") return <span className="pill">IN_STOCK</span>;
  if (status === "ORDERED" || status === "RETURNED") return <span className="pill low">{status}</span>;
  if (status === "SOLD" || status === "DAMAGED" || status === "LOST") {
    return <span className="pill out">{status}</span>;
  }
  return <span className="pill low">{status}</span>;
}
