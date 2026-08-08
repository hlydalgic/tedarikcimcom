import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type MarketplaceSettings = {
  id: string;
  marketplace_name: string;
  short_name: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  support_email: string | null;
  support_phone: string | null;
  company_name: string | null;
  default_currency: string;
  default_country: string;
  default_locale: string;
  seo_title: string | null;
  seo_description: string | null;
  tagline: string | null;
  social_links: Record<string, string>;
};

export type MarketplaceFeatures = {
  reviews_enabled: boolean;
  favorites_enabled: boolean;
  quotes_enabled: boolean;
  special_shipping_enabled: boolean;
  product_variants_enabled: boolean;
  seller_chat_enabled: boolean;
  b2b_pricing_enabled: boolean;
  compare_products_enabled: boolean;
  coupons_enabled: boolean;
};

const DEFAULT_FEATURES: MarketplaceFeatures = {
  reviews_enabled: false,
  favorites_enabled: true,
  quotes_enabled: true,
  special_shipping_enabled: true,
  product_variants_enabled: true,
  seller_chat_enabled: false,
  b2b_pricing_enabled: false,
  compare_products_enabled: false,
  coupons_enabled: false,
};

function fallbackSettings(): MarketplaceSettings {
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Marketplace";

  return {
    id: "00000000-0000-4000-8000-000000000001",
    marketplace_name: appName,
    short_name: appName,
    logo_url: null,
    logo_dark_url: null,
    favicon_url: null,
    primary_color: "#0A4D8C",
    secondary_color: "#1A6B9A",
    accent_color: "#FF6B1A",
    support_email: null,
    support_phone: null,
    company_name: null,
    default_currency: "TRY",
    default_country: "TR",
    default_locale: "tr",
    seo_title: appName,
    seo_description: null,
    tagline: null,
    social_links: {},
  };
}

function mapSettings(row: Record<string, unknown>): MarketplaceSettings {
  const social = row.social_links;
  return {
    id: String(row.id),
    marketplace_name: String(row.marketplace_name),
    short_name: String(row.short_name),
    logo_url: (row.logo_url as string | null) ?? null,
    logo_dark_url: (row.logo_dark_url as string | null) ?? null,
    favicon_url: (row.favicon_url as string | null) ?? null,
    primary_color: String(row.primary_color ?? "#0A4D8C"),
    secondary_color: String(row.secondary_color ?? "#1A6B9A"),
    accent_color: String(row.accent_color ?? "#FF6B1A"),
    support_email: (row.support_email as string | null) ?? null,
    support_phone: (row.support_phone as string | null) ?? null,
    company_name: (row.company_name as string | null) ?? null,
    default_currency: String(row.default_currency ?? "TRY"),
    default_country: String(row.default_country ?? "TR"),
    default_locale: String(row.default_locale ?? "tr"),
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    tagline: (row.tagline as string | null) ?? null,
    social_links:
      social && typeof social === "object" && !Array.isArray(social)
        ? (social as Record<string, string>)
        : {},
  };
}

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Darken a #RRGGBB hex by `percent` (0–100). */
export function darkenHex(hex: string, percent: number): string {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return hex;

  const factor = 1 - percent / 100;
  const r = clampByte(parseInt(raw.slice(0, 2), 16) * factor);
  const g = clampByte(parseInt(raw.slice(2, 4), 16) * factor);
  const b = clampByte(parseInt(raw.slice(4, 6), 16) * factor);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

/** Soft tint for hover surfaces — mix toward white. */
export function softHex(hex: string, whiteMix = 0.88): string {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return hex;

  const mix = (channel: number) =>
    clampByte(channel * (1 - whiteMix) + 255 * whiteMix);

  const r = mix(parseInt(raw.slice(0, 2), 16));
  const g = mix(parseInt(raw.slice(2, 4), 16));
  const b = mix(parseInt(raw.slice(4, 6), 16));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

export function marketplaceCssVars(
  settings: MarketplaceSettings
): Record<string, string> {
  return {
    "--color-primary": settings.primary_color,
    "--color-primary-hover": darkenHex(settings.primary_color, 14),
    "--color-primary-soft": softHex(settings.primary_color),
    "--color-secondary": settings.secondary_color,
    "--color-accent": settings.accent_color,
    "--color-accent-hover": darkenHex(settings.accent_color, 12),
  };
}

export const getMarketplaceSettings = cache(
  async (): Promise<MarketplaceSettings> => {
    const supabase = createPublicClient();
    if (!supabase) return fallbackSettings();

    try {
      const { data, error } = await supabase
        .from("marketplace_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error || !data) return fallbackSettings();
      return mapSettings(data as Record<string, unknown>);
    } catch {
      return fallbackSettings();
    }
  }
);

export const getMarketplaceFeatures = cache(
  async (): Promise<MarketplaceFeatures> => {
    const supabase = createPublicClient();
    if (!supabase) return DEFAULT_FEATURES;

    try {
      const { data, error } = await supabase
        .from("marketplace_features")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error || !data) return DEFAULT_FEATURES;

      return {
        ...DEFAULT_FEATURES,
        ...(data as Partial<MarketplaceFeatures>),
      };
    } catch {
      return DEFAULT_FEATURES;
    }
  }
);

export function isFeatureEnabled(
  features: MarketplaceFeatures,
  key: keyof MarketplaceFeatures
): boolean {
  return features[key] === true;
}
