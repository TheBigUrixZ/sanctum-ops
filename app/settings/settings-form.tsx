"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  brandCode: string;
  currency: string;
  defaultLowStockThreshold: number;
  labelWidth: string;
  labelHeight: string;
  defaultDropCode: string;
};

const exportLinks = [
  ["Products", "products"],
  ["Variants", "variants"],
  ["Inventory Items", "items"],
  ["Inventory Movements", "movements"],
  ["Sales", "sales"],
  ["Expenses", "expenses"],
  ["Drops", "drops"],
] as const;

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetText, setResetText] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Could not save settings.");
      return;
    }

    setMessage("Settings saved.");
    router.refresh();
  }

  async function resetData() {
    if (resetText !== "RESET") {
      setError("Type RESET to confirm.");
      return;
    }

    if (!window.confirm("This clears local products, variants, physical items, movements, sales, expenses, and drops. Continue?")) {
      return;
    }

    setResetBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: resetText }),
    });
    const data = await response.json();
    setResetBusy(false);

    if (!response.ok) {
      setError(data.error || "Could not reset data.");
      return;
    }

    setResetText("");
    setMessage("Local test data cleared.");
    router.refresh();
  }

  return (
    <div className="grid">
      <form className="panel form" onSubmit={submit}>
        <h2>Local Defaults</h2>
        <div className="form-grid">
          <label>
            Brand Code
            <input name="brandCode" defaultValue={settings.brandCode} required />
          </label>
          <label>
            Currency
            <input name="currency" defaultValue={settings.currency} required />
          </label>
          <label>
            Default Low Stock Threshold
            <input
              min="0"
              name="defaultLowStockThreshold"
              type="number"
              defaultValue={settings.defaultLowStockThreshold}
              required
            />
          </label>
          <label>
            Default Drop Code
            <input name="defaultDropCode" defaultValue={settings.defaultDropCode} required />
          </label>
          <label>
            Label Width
            <input name="labelWidth" defaultValue={settings.labelWidth} required />
          </label>
          <label>
            Label Height
            <input name="labelHeight" defaultValue={settings.labelHeight} required />
          </label>
        </div>
        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="notice">{message}</div> : null}
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <section className="panel">
        <h2>Export CSV</h2>
        <div className="export-grid">
          {exportLinks.map(([label, type]) => (
            <a className="button secondary" href={`/api/exports/${type}`} key={type}>
              Download {label}
            </a>
          ))}
        </div>
      </section>

      <section className="panel danger-panel">
        <h2>Reset Test Data</h2>
        <p>
          This clears products, variants, physical inventory items, movements, sales, expenses, and
          drops from this local SQLite database. Settings are kept.
        </p>
        <label>
          Type RESET to confirm
          <input value={resetText} onChange={(event) => setResetText(event.target.value)} />
        </label>
        <button
          className="danger"
          type="button"
          disabled={resetBusy || resetText !== "RESET"}
          onClick={resetData}
        >
          {resetBusy ? "Resetting..." : "Clear Test Data"}
        </button>
      </section>
    </div>
  );
}
