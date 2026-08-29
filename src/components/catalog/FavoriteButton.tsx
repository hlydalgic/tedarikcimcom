"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorites";

type FavoriteButtonProps = {
  productId: string;
  initialFavorited?: boolean;
  className?: string;
};

export function FavoriteButton({
  productId,
  initialFavorited = false,
  className = "",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

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
        startTransition(async () => {
          const result = await toggleFavorite(productId);
          if (result.ok) {
            setFavorited(result.favorited);
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
