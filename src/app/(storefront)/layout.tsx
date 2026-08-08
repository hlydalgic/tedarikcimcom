import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getMarketplaceSettings();

  return (
    <>
      <Header
        branding={{
          shortName: settings.short_name,
          logoUrl: settings.logo_url,
        }}
      />
      <main>{children}</main>
      <Footer
        branding={{
          marketplaceName: settings.marketplace_name,
          shortName: settings.short_name,
          logoUrl: settings.logo_dark_url || settings.logo_url,
          tagline: settings.tagline,
          seoDescription: settings.seo_description,
        }}
      />
    </>
  );
}
