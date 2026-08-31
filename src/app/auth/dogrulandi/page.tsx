import { EmailVerifiedSuccess } from "@/components/auth/EmailVerifiedSuccess";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function EmailVerifiedPage() {
  const settings = await getMarketplaceSettings();

  return (
    <EmailVerifiedSuccess
      shortName={settings.short_name}
      logoUrl={settings.logo_url}
    />
  );
}
