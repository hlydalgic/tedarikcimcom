import { RegisterForm } from "@/components/auth/RegisterForm";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function KayitPage() {
  const settings = await getMarketplaceSettings();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-soft">
        <RegisterForm
          shortName={settings.short_name}
          logoUrl={settings.logo_url}
          marketplaceName={settings.marketplace_name}
        />
      </div>
    </div>
  );
}
