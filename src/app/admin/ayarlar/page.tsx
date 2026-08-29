import { SettingsAdmin } from "@/components/admin/settings/SettingsAdmin";
import { PlatformSettingsForm } from "@/components/admin/settings/PlatformSettingsForm";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
} from "@/lib/marketplace/settings";
import { getPlatformOpsSettings } from "@/lib/admin/queries";

export default async function AdminSettingsPage() {
  const [settings, features, platformOps] = await Promise.all([
    getMarketplaceSettings(),
    getMarketplaceFeatures(),
    getPlatformOpsSettings(),
  ]);

  return (
    <>
      <SettingsAdmin settings={settings} features={features} />
      <PlatformSettingsForm initial={platformOps} />
    </>
  );
}
