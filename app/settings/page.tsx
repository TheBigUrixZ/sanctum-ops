import { getSettings } from "@/lib/settings";
import SettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="grid">
      <header className="page-head">
        <div>
          <p className="eyebrow">Local setup</p>
          <h1>Settings</h1>
          <p>Version 1 is local-only with SQLite. Shopify, Discord, and deployment are not enabled.</p>
        </div>
      </header>
      <SettingsForm settings={settings} />
    </div>
  );
}
