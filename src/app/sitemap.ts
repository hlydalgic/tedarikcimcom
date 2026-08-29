import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { listSitemapEntries } from "@/lib/seo/sitemap-queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();
  const entries = await listSitemapEntries();

  return entries.map((entry) => ({
    url: `${siteUrl.replace(/\/$/, "")}${entry.path}`,
    lastModified: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    changeFrequency: entry.path.startsWith("/urunler/")
      ? "daily"
      : entry.path === "/"
        ? "daily"
        : "weekly",
    priority: entry.path === "/" ? 1 : entry.path.startsWith("/urunler/") ? 0.8 : 0.6,
  }));
}
