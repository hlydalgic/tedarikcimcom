import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TrustSection } from "@/components/home/TrustSection";
import { SellerCta } from "@/components/home/SellerCta";
import { RecentlyViewedStrip } from "@/components/catalog/RecentlyViewedStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);
  const title = settings.seo_title?.trim() || settings.marketplace_name;
  const description =
    settings.seo_description?.trim() || settings.tagline?.trim() || undefined;

  return buildPageMetadata({
    title,
    description,
    siteName: settings.marketplace_name,
    canonicalPath: "/",
    siteUrl,
    imageUrl: settings.logo_url,
  });
}

export default async function HomePage() {
  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);

  const orgJsonLd = buildOrganizationJsonLd({
    name: settings.marketplace_name,
    url: siteUrl,
    logoUrl: settings.logo_url,
    description: settings.seo_description ?? settings.tagline,
    email: settings.support_email,
    phone: settings.support_phone,
    socialLinks: settings.social_links,
  });

  const webSiteJsonLd = buildWebSiteJsonLd({
    name: settings.marketplace_name,
    url: siteUrl,
    description: settings.seo_description ?? settings.tagline,
  });

  return (
    <>
      <JsonLd data={[orgJsonLd, webSiteJsonLd]} />
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
