import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import LabelsClient from "./labels-client";

export default async function LabelsPage() {
  const [variants, settings] = await Promise.all([
    prisma.productVariant.findMany({
    include: {
      product: true,
      items: {
        orderBy: { itemCode: "asc" },
      },
    },
    orderBy: [
      {
        product: {
          name: "asc",
        },
      },
      { color: "asc" },
      { size: "asc" },
      { dropCode: "asc" },
    ],
  }),
    getSettings(),
  ]);

  return (
    <div className="grid labels-page">
      <header className="page-head no-print">
        <div>
          <p className="eyebrow">Barcode labels</p>
          <h1>Labels</h1>
          <p>Print short scannable barcode IDs with long item codes as human-readable text.</p>
        </div>
      </header>
      <LabelsClient variants={variants} settings={settings} />
    </div>
  );
}
