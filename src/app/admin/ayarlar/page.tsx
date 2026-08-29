import { SettingsAdmin } from "@/components/admin/settings/SettingsAdmin";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
} from "@/lib/marketplace/settings";

export default async function AdminSettingsPage() {
  const [settings, features] = await Promise.all([
    getMarketplaceSettings(),
    getMarketplaceFeatures(),
  ]);

  return <SettingsAdmin settings={settings} features={features} />;
}
