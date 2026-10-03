"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorites";
import { loadFavoriteIds, rememberFavorite } from "@/lib/favorites/client";

type FavoriteButtonProps = {
  productId: string;
  /** Omit on statically cached pages; state is then loaded in the browser. */
  initialFavorited?: boolean;
  className?: string;
};

export function FavoriteButton({
  productId,
  initialFavorited,
  className = "",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const [pending, startTransition] = useTransition();
  const touched = useRef(false);

  useEffect(() => {
    if (initialFavorited !== undefined) return;
    let cancelled = false;
    void loadFavoriteIds().then((ids) => {
      if (!cancelled && !touched.current) setFavorited(ids.has(productId));
    });
    return () => {
      cancelled = true;
    };
  }, [initialFavorited, productId]);

  return (
    <button
      type="button"
      aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={favorited}
      disabled={pending}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:text-accent disabled:opacity-60 ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        touched.current = true;
        startTransition(async () => {
          const result = await toggleFavorite(productId);
          if (result.ok) {
            setFavorited(result.favorited);
            rememberFavorite(productId, result.favorited);
          } else if (result.error.includes("giriş")) {
            window.location.href = `/giris?next=${encodeURIComponent(window.location.pathname)}`;
          }
        });
      }}
    >
      <Heart
        className={`h-4 w-4 ${favorited ? "fill-accent text-accent" : ""}`}
      />
    </button>
  );
}
