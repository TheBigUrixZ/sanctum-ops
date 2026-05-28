import ScanClient from "./scan-client";

export default function ScanPage() {
  return (
    <div className="grid">
      <header className="page-head">
        <div>
          <p className="eyebrow">Fast updates</p>
          <h1>Scan Mode</h1>
          <p>Scan short barcode IDs to receive inventory, look items up, or mark them sold.</p>
        </div>
      </header>
      <ScanClient />
    </div>
  );
}
