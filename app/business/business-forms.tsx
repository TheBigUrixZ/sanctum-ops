"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { expenseCategories } from "@/lib/business";

function today() {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  saving: boolean;
  message: string;
  error: string;
};

const initialState: FormState = {
  saving: false,
  message: "",
  error: "",
};

export function DropForm() {
  const router = useRouter();
  const [state, setState] = useState(initialState);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ saving: true, message: "", error: "" });

    const response = await fetch("/api/drops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await response.json();

    if (!response.ok) {
      setState({ saving: false, message: "", error: data.error || "Could not create drop." });
      return;
    }

    form.reset();
    setState({ saving: false, message: "Drop created.", error: "" });
    router.refresh();
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Create Drop</h2>
      <div className="form-grid">
        <label>
          Name
          <input name="name" placeholder="Cold Air Essentials" required />
        </label>
        <label>
          Code
          <input name="code" placeholder="D001" required />
        </label>
        <label>
          Release Date
          <input name="releaseDate" type="date" />
        </label>
      </div>
      <label>
        Notes
        <textarea name="notes" rows={3} />
      </label>
      {state.error ? <div className="error">{state.error}</div> : null}
      {state.message ? <div>{state.message}</div> : null}
      <button type="submit" disabled={state.saving}>
        {state.saving ? "Saving..." : "Create Drop"}
      </button>
    </form>
  );
}

export function SaleForm() {
  const router = useRouter();
  const [state, setState] = useState(initialState);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ saving: true, message: "", error: "" });

    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await response.json();

    if (!response.ok) {
      setState({ saving: false, message: "", error: data.error || "Could not log sale." });
      return;
    }

    form.reset();
    setState({ saving: false, message: "Sale logged and stock updated.", error: "" });
    router.refresh();
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Log Manual Sale</h2>
      <div className="form-grid">
        <label>
          SKU or Barcode
          <input name="sku" placeholder="CAE-HOOD-BLK-L-D001" required />
        </label>
        <label>
          Quantity
          <input min="1" name="quantity" type="number" defaultValue="1" required />
        </label>
        <label>
          Sale Price
          <input min="0" name="salePrice" step="0.01" type="number" required />
        </label>
        <label>
          Platform
          <input name="platform" placeholder="Instagram, Pop-up, Website" />
        </label>
        <label>
          Fees
          <input min="0" name="fees" step="0.01" type="number" />
        </label>
        <label>
          Shipping Cost
          <input min="0" name="shippingCost" step="0.01" type="number" />
        </label>
        <label>
          Date
          <input name="date" type="date" defaultValue={today()} required />
        </label>
      </div>
      <label>
        Note
        <textarea name="note" rows={3} />
      </label>
      {state.error ? <div className="error">{state.error}</div> : null}
      {state.message ? <div>{state.message}</div> : null}
      <button type="submit" disabled={state.saving}>
        {state.saving ? "Saving..." : "Log Sale"}
      </button>
    </form>
  );
}

export function ExpenseForm() {
  const router = useRouter();
  const [state, setState] = useState(initialState);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ saving: true, message: "", error: "" });

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await response.json();

    if (!response.ok) {
      setState({ saving: false, message: "", error: data.error || "Could not log expense." });
      return;
    }

    form.reset();
    setState({ saving: false, message: "Expense logged.", error: "" });
    router.refresh();
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Log Expense</h2>
      <div className="form-grid">
        <label>
          Name
          <input name="name" placeholder="Poly mailers" required />
        </label>
        <label>
          Category
          <select name="category" defaultValue="Packaging">
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount
          <input min="0" name="amount" step="0.01" type="number" required />
        </label>
        <label>
          Date
          <input name="date" type="date" defaultValue={today()} required />
        </label>
      </div>
      <label>
        Note
        <textarea name="note" rows={3} />
      </label>
      {state.error ? <div className="error">{state.error}</div> : null}
      {state.message ? <div>{state.message}</div> : null}
      <button type="submit" disabled={state.saving}>
        {state.saving ? "Saving..." : "Log Expense"}
      </button>
    </form>
  );
}
