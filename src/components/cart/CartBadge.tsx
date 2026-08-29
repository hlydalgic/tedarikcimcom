"use client";

import { useCartStore, cartItemCount } from "@/lib/cart/store";

export function CartBadge() {
  const count = useCartStore((s) => cartItemCount(s.items));
  if (count <= 0) return null;
  return (
    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded bg-accent px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
