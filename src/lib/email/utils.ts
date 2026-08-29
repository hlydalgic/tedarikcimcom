import "server-only";

import {
  getMarketplaceSettings,
  type MarketplaceSettings,
} from "@/lib/marketplace/settings";

export type EmailBrand = {
  marketplaceName: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
  siteUrl: string;
};

export async function getEmailBrand(): Promise<EmailBrand> {
  const settings = await getMarketplaceSettings();
  return brandFromSettings(settings);
}

export function brandFromSettings(settings: MarketplaceSettings): EmailBrand {
  const siteUrl =
    settings.site_url?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return {
    marketplaceName: settings.marketplace_name,
    logoUrl: settings.logo_url,
    primaryColor: settings.primary_color,
    supportEmail: settings.support_email,
    siteUrl,
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
