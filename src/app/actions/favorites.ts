"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMarketplaceFeatures, isFeatureEnabled } from "@/lib/marketplace/settings";

export type FavoriteActionResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string };

export async function toggleFavorite(
  productId: string
): Promise<FavoriteActionResult> {
  const features = await getMarketplaceFeatures();
  if (!isFeatureEnabled(features, "favorites_enabled")) {
    return { ok: false, error: "Favoriler bu pazaryerinde kapalı." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Favorilere eklemek için giriş yapmalısınız." };
  }

  const { data: existing } = await supabase
    .from("favourites")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/hesabim/favoriler");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase.from("favourites").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/hesabim/favoriler");
  return { ok: true, favorited: true };
}
