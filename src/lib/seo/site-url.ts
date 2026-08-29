import "server-only";

import { getMarketplaceSettings } from "@/lib/marketplace/settings";

export async function getSiteUrl(): Promise<string> {
  const settings = await getMarketplaceSettings();
  const fromDb = settings.site_url?.trim().replace(/\/$/, "");
  if (fromDb) return fromDb;

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getSiteUrlSync(settings?: { site_url?: string | null }): string {
  const fromDb = settings?.site_url?.trim().replace(/\/$/, "");
  if (fromDb) return fromDb;

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function absoluteUrl(base: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}
