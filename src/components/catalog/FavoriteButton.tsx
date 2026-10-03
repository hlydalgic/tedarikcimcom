"use client";

import { Heart } from "lucide-react";
import { useFavoriteStatus } from "@/lib/favorites/useFavoriteStatus";

type FavoriteButtonProps = {
  productId: string;
  className?: string;
};

export function FavoriteButton({ productId, className = "" }: FavoriteButtonProps) {
  const { favorited, pending, toggle } = useFavoriteStatus(productId);

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
        toggle();
      }}
    >
      <Heart
        className={`h-4 w-4 ${favorited ? "fill-accent text-accent" : ""}`}
      />
    </button>
  );
}
