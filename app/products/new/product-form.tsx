"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_CODE, colorCodes, generateSku, productCodes } from "@/lib/codes";

type Settings = {
  brandCode: string;
  defaultDropCode: string;
  defaultLowStockThreshold: number;
};

export default function ProductForm({
  settings = {
    brandCode: BRAND_CODE,
    defaultDropCode: "D001",
    defaultLowStockThreshold: 2,
  },
}: {
  settings?: Settings;
}) {
  const router = useRouter();
  const [productName, setProductName] = useState("Hoodie");
  const [color, setColor] = useState("Black");
  const [size, setSize] = useState("L");
  const [dropCode, setDropCode] = useState(settings.defaultDropCode);
  const [quantity, setQuantity] = useState("1");
  const [cost, setCost] = useState("0");
  const [sellPrice, setSellPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sku = useMemo(
    () =>
      generateSku({
        brandCode: settings.brandCode,
        productCode: productCodes[productName as keyof typeof productCodes],
        colorCode: colorCodes[color as keyof typeof colorCodes],
        size,
        dropCode,
      }),
    [color, dropCode, productName, settings.brandCode, size],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName,
        color,
        size,
        dropCode,
        quantity: Number(quantity),
        cost: Number(cost),
        sellPrice: Number(sellPrice),
        lowStockThreshold: settings.defaultLowStockThreshold,
        imageUrl,
        description,
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Could not add product variant.");
      return;
    }

    router.push("/inventory");
    router.refresh();
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Product
          <select value={productName} onChange={(event) => setProductName(event.target.value)}>
            {Object.keys(productCodes).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Color
          <select value={color} onChange={(event) => setColor(event.target.value)}>
            {Object.keys(colorCodes).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Size
          <input value={size} onChange={(event) => setSize(event.target.value)} />
        </label>
        <label>
          Drop Code
          <input value={dropCode} onChange={(event) => setDropCode(event.target.value)} />
        </label>
        <label>
          Quantity Ordered
          <input
            min="0"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label>
          Cost
          <input
            min="0"
            step="0.01"
            type="number"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
          />
        </label>
        <label>
          Sell Price
          <input
            min="0"
            step="0.01"
            type="number"
            value={sellPrice}
            onChange={(event) => setSellPrice(event.target.value)}
          />
        </label>
        <label>
          Brand Code
          <input value={settings.brandCode || BRAND_CODE} disabled />
        </label>
      </div>

      <label>
        Image URL
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="Optional product or variant image URL"
        />
      </label>

      <label>
        Notes
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="sku-preview">
        Variant SKU. Item barcodes will be generated as unique numbered itemCodes.
        <strong>{sku}</strong>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="action-row">
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add Variant"}
        </button>
      </div>
    </form>
  );
}
