import ProductForm from "./product-form";
import { getSettings } from "@/lib/settings";

export default async function NewProductPage() {
  const settings = await getSettings();

  return (
    <div className="grid">
      <header className="page-head">
        <div>
          <p className="eyebrow">Create</p>
          <h1>Add Product Variant</h1>
          <p>Choose a product type, color, size, quantity, pricing, and drop code.</p>
        </div>
      </header>
      <ProductForm settings={settings} />
    </div>
  );
}
