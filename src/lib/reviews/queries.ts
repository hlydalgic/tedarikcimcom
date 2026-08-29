import "server-only";

import { ensureReviewsEnabled } from "@/lib/marketplace/feature-guards";

/** Placeholder until product reviews ship — enforces reviews_enabled server-side. */
export async function listProductReviews(_productId: string): Promise<never[]> {
  const guard = await ensureReviewsEnabled();
  if (!guard.ok) return [];
  return [];
}
