"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";
import {
  loadFavoriteIds,
  rememberFavorite,
  subscribeFavorites,
} from "@/lib/favorites/client";

export function useFavoriteStatus(productId: string) {
  const [favorited, setFavorited] = useState(false);
  const [pending, startTransition] = useTransition();
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadFavoriteIds().then((ids) => {
      if (!cancelled && !touched.current) setFavorited(ids.has(productId));
    });
    const unsubscribe = subscribeFavorites((id, value) => {
      if (id === productId) setFavorited(value);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [productId]);

  const toggle = useCallback(() => {
    touched.current = true;
    startTransition(async () => {
      const result = await toggleFavorite(productId);
      if (result.ok) {
        rememberFavorite(productId, result.favorited);
      } else if (result.error.includes("giriş")) {
        window.location.href = `/giris?next=${encodeURIComponent(window.location.pathname)}`;
      }
    });
  }, [productId]);

  return { favorited, pending, toggle };
}
