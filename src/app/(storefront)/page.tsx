import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TrustSection } from "@/components/home/TrustSection";
import { SellerCta } from "@/components/home/SellerCta";
import { RecentlyViewedStrip } from "@/components/catalog/RecentlyViewedStrip";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export default async function HomePage() {
  const settings = await getMarketplaceSettings();

  return (
    <>
      <Hero
        branding={{
          shortName: settings.short_name,
          logoUrl: settings.logo_url,
          seoTitle: settings.seo_title,
          tagline: settings.tagline,
          marketplaceName: settings.marketplace_name,
        }}
      />
      <CategoryGrid />
      <FeaturedProducts />
      <RecentlyViewedStrip />
      <TrustSection />
      <SellerCta />
    </>
  );
}
