import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlugPath, getShopBySlug } from "@/lib/catalog/queries";
import type { DecodedSearchParams } from "@/lib/catalog/isr-query";
import { getMarketplaceSettings } from "@/lib/marketplace/settings";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site-url";

export type PageSearchParams = Record<string, string | string[] | undefined>;

export function toURLSearchParams(
  input: PageSearchParams | DecodedSearchParams
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
  }
  return params;
}

export async function buildCategoryMetadata(slug: string[]): Promise<Metadata> {
  const category = await getCategoryBySlugPath(slug);
  if (!category) notFound();

  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);
  const title = category.seo_title ?? category.name;
  const description =
    category.seo_description ?? category.description ?? settings.seo_description;

  return buildPageMetadata({
    title: `${title} | ${settings.marketplace_name}`,
    description,
    siteName: settings.marketplace_name,
    canonicalPath: `/kategoriler/${slug.join("/")}`,
    siteUrl,
    imageUrl: category.image_url,
  });
}

export async function buildShopMetadata(slug: string): Promise<Metadata> {
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);

  return buildPageMetadata({
    title: `${shop.name} | ${settings.marketplace_name}`,
    description: shop.description,
    siteName: settings.marketplace_name,
    canonicalPath: `/magaza/${slug}`,
    siteUrl,
    imageUrl: shop.banner_url ?? shop.logo_url,
  });
}

export async function buildSearchMetadata(
  searchParams: PageSearchParams
): Promise<Metadata> {
  const [settings, siteUrl] = await Promise.all([
    getMarketplaceSettings(),
    getSiteUrl(),
  ]);
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const title = q ? `"${q}" arama sonuçları` : "Arama";

  return buildPageMetadata({
    title: `${title} | ${settings.marketplace_name}`,
    description: q ? `"${q}" için arama sonuçları` : settings.seo_description,
    siteName: settings.marketplace_name,
    canonicalPath: q ? `/arama?q=${encodeURIComponent(q)}` : "/arama",
    siteUrl,
    noIndex: true,
  });
}
