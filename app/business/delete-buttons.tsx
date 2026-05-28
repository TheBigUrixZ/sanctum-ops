"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteSaleButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function deleteSale() {
    if (!window.confirm("Delete this sale record? This changes finance totals but does not change item status.")) {
      return;
    }
    setBusy(true);
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button className="danger compact-button" type="button" disabled={busy} onClick={deleteSale}>
      Delete
    </button>
  );
}

export function DeleteExpenseButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function deleteExpense() {
    if (!window.confirm("Delete this expense record?")) {
      return;
    }
    setBusy(true);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button className="danger compact-button" type="button" disabled={busy} onClick={deleteExpense}>
      Delete
    </button>
  );
}
