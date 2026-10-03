import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { Footer } from "@/components/layout/Footer";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { StorefrontPwa } from "@/components/pwa/StorefrontPwa";
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
    <StorefrontPwa>
      <AnalyticsTracker />
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <div className="flex min-h-screen flex-col">
        <Header
          branding={{
            shortName: settings.short_name,
            logoUrl: settings.logo_url,
          }}
          navCategories={navCategories}
          favoritesEnabled={isFeatureEnabled(features, "favorites_enabled")}
        />
        <main className="flex-1">{children}</main>
        <Footer
          branding={{
            marketplaceName: settings.marketplace_name,
            shortName: settings.short_name,
            logoUrl: settings.logo_dark_url || settings.logo_url,
            tagline: settings.tagline,
            seoDescription: settings.seo_description,
          }}
        />
      </div>
    </StorefrontPwa>
  );
}
