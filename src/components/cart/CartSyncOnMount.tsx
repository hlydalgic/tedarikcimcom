"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/cart/store";
import type { CartItem } from "@/lib/cart/types";

/** Refresh cart prices/stock from DB after hydrate (login or page load). */
export function CartSyncOnMount() {
  const items = useCartStore((s) => s.items);
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    // Wait for zustand persist hydrate
    const unsub = useCartStore.persist.onFinishHydration(() => {
      void sync();
    });
    if (useCartStore.persist.hasHydrated()) {
      void sync();
    }
    return () => {
      unsub();
    };

    async function sync() {
      if (ran.current) return;
      ran.current = true;
      const current = useCartStore.getState().items;
      if (!current.length) return;

      try {
        const res = await fetch("/api/sepet/senkron", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productIds: current.map((i) => i.productId),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: CartItem[] };
        const byId = new Map(data.items.map((i) => [i.productId, i]));
        const next: CartItem[] = [];
        for (const local of current) {
          const fresh = byId.get(local.productId);
          if (!fresh || fresh.stock <= 0) continue;
          next.push({
            ...fresh,
            quantity: Math.min(local.quantity, fresh.stock),
          });
        }
        replaceFromServer(next);
      } catch {
        /* ignore */
      }
    }
  }, [items.length, replaceFromServer]);

  return null;
}
