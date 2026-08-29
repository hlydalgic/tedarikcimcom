import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { listNavCategories } from "@/lib/catalog/queries";
import {
  getMarketplaceFeatures,
  getMarketplaceSettings,
  isFeatureEnabled,
} from "@/lib/marketplace/settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, navCategories, features] = await Promise.all([
    getMarketplaceSettings(),
    listNavCategories(),
    getMarketplaceFeatures(),
  ]);

  return (
    <>
      <AnalyticsTracker />
      <Header
        branding={{
          shortName: settings.short_name,
          logoUrl: settings.logo_url,
        }}
        navCategories={navCategories}
        favoritesEnabled={isFeatureEnabled(features, "favorites_enabled")}
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
