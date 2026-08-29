import "server-only";

import {
  getMarketplaceFeatures,
  isFeatureEnabled,
  type MarketplaceFeatures,
} from "@/lib/marketplace/settings";

export type FeatureGuardResult =
  | { ok: true; features: MarketplaceFeatures }
  | { ok: false; error: string };

async function guardFeature(
  key: keyof MarketplaceFeatures,
  message: string
): Promise<FeatureGuardResult> {
  const features = await getMarketplaceFeatures();
  if (!isFeatureEnabled(features, key)) {
    return { ok: false, error: message };
  }
  return { ok: true, features };
}

export async function ensureQuotesEnabled(): Promise<FeatureGuardResult> {
  return guardFeature("quotes_enabled", "Teklif sistemi kapalı.");
}

export async function ensureFavoritesEnabled(): Promise<FeatureGuardResult> {
  return guardFeature("favorites_enabled", "Favoriler bu pazaryerinde kapalı.");
}

export async function ensureReviewsEnabled(): Promise<FeatureGuardResult> {
  return guardFeature("reviews_enabled", "Ürün yorumları kapalı.");
}

export async function isReviewsEnabled(): Promise<boolean> {
  const features = await getMarketplaceFeatures();
  return isFeatureEnabled(features, "reviews_enabled");
}
