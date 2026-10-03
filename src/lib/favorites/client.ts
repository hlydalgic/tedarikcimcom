"use client";

import { createClient } from "@/lib/supabase/client";

let cached: { userId: string; promise: Promise<Set<string>> } | null = null;

export async function loadFavoriteIds(): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user.id;

  if (!userId) {
    cached = null;
    return new Set();
  }

  if (cached?.userId !== userId) {
    cached = {
      userId,
      promise: Promise.resolve(
        supabase.from("favourites").select("product_id").eq("user_id", userId)
      ).then(
        ({ data }) =>
          new Set((data ?? []).map((row) => row.product_id as string))
      ),
    };
  }

  return cached.promise;
}

export function rememberFavorite(productId: string, favorited: boolean) {
  void cached?.promise.then((ids) => {
    if (favorited) ids.add(productId);
    else ids.delete(productId);
  });
}
